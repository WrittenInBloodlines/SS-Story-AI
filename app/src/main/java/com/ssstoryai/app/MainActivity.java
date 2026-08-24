package com.ssstoryai.app;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.print.PrintAttributes;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.io.File;
import java.io.InputStream;
import java.io.FileOutputStream;

public class MainActivity extends Activity {
    private static final int MODEL_PICK_REQUEST = 4101;
    private WebView webView;
    private GemmaRuntime gemmaRuntime;

    public class AndroidBridge {
        @JavascriptInterface
        public void printPage(String format) {
            runOnUiThread(() -> {
                PrintManager printManager = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                if (printManager == null || webView == null) return;

                PrintAttributes.MediaSize mediaSize;
                switch (format == null ? "a5" : format.toLowerCase()) {
                    case "a3": mediaSize = PrintAttributes.MediaSize.ISO_A3; break;
                    case "a4": mediaSize = PrintAttributes.MediaSize.ISO_A4; break;
                    case "a5": mediaSize = PrintAttributes.MediaSize.ISO_A5; break;
                    case "a6": mediaSize = PrintAttributes.MediaSize.ISO_A6; break;
                    case "a7": mediaSize = PrintAttributes.MediaSize.ISO_A7; break;
                    case "b4": mediaSize = PrintAttributes.MediaSize.ISO_B4; break;
                    case "b5": mediaSize = PrintAttributes.MediaSize.ISO_B5; break;
                    case "legal": mediaSize = PrintAttributes.MediaSize.NA_LEGAL; break;
                    case "letter": default: mediaSize = PrintAttributes.MediaSize.NA_LETTER; break;
                }

                String jobName = "S•S Story AI Book";
                printManager.print(
                        jobName,
                        webView.createPrintDocumentAdapter(jobName),
                        new PrintAttributes.Builder()
                                .setMediaSize(mediaSize)
                                .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                                .build()
                );
            });
        }

        @JavascriptInterface
        public String generateGemma(String payload) {
            if (gemmaRuntime == null) {
                return "{\"ok\":false,\"code\":\"LOCAL_MODEL_UNAVAILABLE\",\"message\":\"The local Gemma runtime is unavailable.\"}";
            }
            return gemmaRuntime.generate(payload);
        }

        @JavascriptInterface
        public String gemmaStatus() {
            boolean loaded = gemmaRuntime != null && gemmaRuntime.isLoaded();
            return "{\"loaded\":" + loaded + ",\"model\":\"" + (loaded ? "Gemma • Local Android" : "No local model loaded") + "\"}";
        }

        @JavascriptInterface
        public void pickGemmaModel() {
            Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType("*/*");
            startActivityForResult(intent, MODEL_PICK_REQUEST);
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);
        gemmaRuntime = new GemmaRuntime(this);

        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.setWebChromeClient(new WebChromeClient());
        webView.addJavascriptInterface(new AndroidBridge(), "AndroidBridge");

        WebViewAssetLoader assetLoader = new WebViewAssetLoader.Builder()
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return assetLoader.shouldInterceptRequest(request.getUrl());
            }
        });
        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html");

        File bundledModel = new File(getFilesDir(), "models/gemma-model.gguf");
        if (bundledModel.exists()) {
            loadGemmaInBackground(bundledModel);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != MODEL_PICK_REQUEST || resultCode != RESULT_OK || data == null || data.getData() == null) {
            return;
        }

        Uri uri = data.getData();
        File modelDir = new File(getFilesDir(), "models");
        if (!modelDir.exists()) modelDir.mkdirs();
        File destination = new File(modelDir, "gemma-model.gguf");

        new Thread(() -> {
            try {
                copyUriToFile(uri, destination);
                loadGemmaInBackground(destination);
            } catch (Exception error) {
                notifyGemmaStatus(false, "Could not copy the model: " + error.getMessage());
            }
        }, "gemma-model-copy").start();
    }

    private void loadGemmaInBackground(File modelFile) {
        new Thread(() -> {
            String result = gemmaRuntime.loadModel(modelFile.getAbsolutePath());
            boolean ok = "OK".equals(result);
            notifyGemmaStatus(ok, ok ? "Gemma is loaded and ready." : result);
        }, "gemma-model-load").start();
    }

    private void notifyGemmaStatus(boolean ok, String message) {
        runOnUiThread(() -> {
            if (webView == null) return;
            String script = "window.dispatchEvent(new CustomEvent('ss-gemma-status',{detail:{ok:" + ok
                    + ",message:" + JSONObject.quote(message) + "}}));";
            webView.evaluateJavascript(script, null);
        });
    }

    private void copyUriToFile(Uri uri, File destination) throws Exception {
        try (InputStream input = getContentResolver().openInputStream(uri);
             FileOutputStream output = new FileOutputStream(destination, false)) {
            if (input == null) throw new IllegalStateException("The selected file could not be opened.");
            byte[] buffer = new byte[1024 * 1024];
            int read;
            while ((read = input.read(buffer)) != -1) {
                output.write(buffer, 0, read);
            }
            output.flush();
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (gemmaRuntime != null) gemmaRuntime.close();
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
