package com.sahebpaper.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int CAMERA_PERMISSION_REQUEST_CODE = 1001;
    private static final int STORAGE_PERMISSION_REQUEST_CODE = 1002;
    private android.webkit.WebView mPrintWebView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        checkAndRequestCameraPermission();
    }

    private void checkAndRequestCameraPermission() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{
                Manifest.permission.CAMERA,
                Manifest.permission.VIBRATE
            }, CAMERA_PERMISSION_REQUEST_CODE);
        }
    }

    public void checkAndRequestStoragePermissionIfNeeded() {
        // Only Android 9 (API 28) and below require runtime WRITE_EXTERNAL_STORAGE for public Downloads.
        // Android 10+ (API 29+) uses MediaStore without dangerous permissions.
        if (android.os.Build.VERSION.SDK_INT <= android.os.Build.VERSION_CODES.P) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{
                    Manifest.permission.WRITE_EXTERNAL_STORAGE,
                    Manifest.permission.READ_EXTERNAL_STORAGE
                }, STORAGE_PERMISSION_REQUEST_CODE);
            }
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new AndroidNativeBridge(), "AndroidNativeBridge");
            getBridge().getWebView().setWebChromeClient(new com.getcapacitor.BridgeWebChromeClient(getBridge()) {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(() -> {
                        String[] resources = request.getResources();
                        for (String resource : resources) {
                            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
                                    request.grant(new String[]{PermissionRequest.RESOURCE_VIDEO_CAPTURE});
                                    return;
                                } else {
                                    ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_REQUEST_CODE);
                                }
                            }
                        }
                        request.grant(resources);
                    });
                }
            });
        }
    }

    public class AndroidNativeBridge {
        @android.webkit.JavascriptInterface
        public void printDocument(final String jobName) {
            runOnUiThread(() -> {
                try {
                    android.print.PrintManager printManager = (android.print.PrintManager) getSystemService(android.content.Context.PRINT_SERVICE);
                    if (printManager != null && getBridge() != null && getBridge().getWebView() != null) {
                        String cleanJobName = (jobName != null && !jobName.trim().isEmpty()) ? jobName : "SahebPaper_Document";
                        android.print.PrintDocumentAdapter printAdapter = getBridge().getWebView().createPrintDocumentAdapter(cleanJobName);
                        printManager.print(cleanJobName, printAdapter, new android.print.PrintAttributes.Builder().build());
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }

        @android.webkit.JavascriptInterface
        public void printHtml(final String htmlContent, final String jobName) {
            runOnUiThread(() -> {
                try {
                    // Strong member reference mPrintWebView prevents garbage collection during print job preparation
                    mPrintWebView = new android.webkit.WebView(MainActivity.this);
                    mPrintWebView.setWebViewClient(new android.webkit.WebViewClient() {
                        @Override
                        public void onPageFinished(android.webkit.WebView view, String url) {
                            android.print.PrintManager printManager = (android.print.PrintManager) getSystemService(android.content.Context.PRINT_SERVICE);
                            if (printManager != null) {
                                String cleanJobName = (jobName != null && !jobName.trim().isEmpty()) ? jobName : "SahebPaper_Document";
                                android.print.PrintDocumentAdapter printAdapter = view.createPrintDocumentAdapter(cleanJobName);
                                printManager.print(cleanJobName, printAdapter, new android.print.PrintAttributes.Builder().build());
                            }
                        }
                    });
                    mPrintWebView.loadDataWithBaseURL("file:///android_asset/", htmlContent, "text/html", "UTF-8", null);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }

        @android.webkit.JavascriptInterface
        public boolean saveToDownloads(final String base64Data, final String filename, final String mimeType) {
            try {
                final byte[] bytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT);
                final String safeMime = (mimeType != null && !mimeType.isEmpty()) ? mimeType : "application/octet-stream";

                // Android 10+ (Q, API 29+): Use MediaStore.Downloads (No dangerous permissions required!)
                if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                    android.content.ContentValues values = new android.content.ContentValues();
                    values.put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, filename);
                    values.put(android.provider.MediaStore.MediaColumns.MIME_TYPE, safeMime);
                    values.put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS);

                    android.net.Uri uri = getContentResolver().insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (uri != null) {
                        try (java.io.OutputStream os = getContentResolver().openOutputStream(uri)) {
                            if (os != null) {
                                os.write(bytes);
                                os.flush();
                            }
                        }
                        runOnUiThread(() -> android.widget.Toast.makeText(MainActivity.this, "Saved to Downloads: " + filename, android.widget.Toast.LENGTH_SHORT).show());
                        return true;
                    }
                }

                // Android 9 and below: check/request WRITE_EXTERNAL_STORAGE only if needed
                runOnUiThread(() -> checkAndRequestStoragePermissionIfNeeded());

                java.io.File downloadDir = android.os.Environment.getExternalStoragePublicDirectory(android.os.Environment.DIRECTORY_DOWNLOADS);
                if (downloadDir != null) {
                    if (!downloadDir.exists()) downloadDir.mkdirs();
                    java.io.File targetFile = new java.io.File(downloadDir, filename);

                    try (java.io.FileOutputStream fos = new java.io.FileOutputStream(targetFile)) {
                        fos.write(bytes);
                        fos.flush();
                    }

                    // Trigger Android Media Scanner so file appears immediately in the Downloads app
                    android.media.MediaScannerConnection.scanFile(
                        MainActivity.this,
                        new String[]{targetFile.getAbsolutePath()},
                        new String[]{safeMime},
                        null
                    );
                    runOnUiThread(() -> android.widget.Toast.makeText(MainActivity.this, "Saved to Downloads: " + filename, android.widget.Toast.LENGTH_SHORT).show());
                    return true;
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            return false;
        }
    }
}
