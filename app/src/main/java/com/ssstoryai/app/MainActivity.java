package com.ssstoryai.app;

import android.app.Activity;
import android.content.Context;
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

public class MainActivity extends Activity {
    private WebView webView;

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
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);
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
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
