package io.github.firatnexus.reelsorganizer;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.view.View;
import android.view.Window;

import androidx.activity.result.ActivityResult;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Small native bridge for Sakla (Reels Organizer).
 *
 * - Receives text shared from other apps (Instagram "Share" -> Reels Organizer).
 * - Opens links with ACTION_VIEW so instagram.com links go to the Instagram app.
 * - Saves backup files through the system "Save as" dialog (Storage Access Framework).
 * - Reads the clipboard and colors the system bars.
 * - Fetches Instagram's public embed page and stores compressed cover/avatar
 *   images locally (the same public data the in-app preview already uses).
 *
 * It never reads Instagram cookies, sessions or accounts.
 */
@CapacitorPlugin(name = "ReelsBridge")
public class ReelsBridgePlugin extends Plugin {

    private static final String UA =
            "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";
    private final ExecutorService io = Executors.newSingleThreadExecutor();
    private static JSObject pendingShare;
    private static ReelsBridgePlugin instance;
    private String pendingSaveText;
    /** Set when the web layer has painted its first frame (splash hand-off). */
    private static volatile boolean firstFrameReady = false;
    private static final long LAUNCHED_AT = android.os.SystemClock.uptimeMillis();
    /** Safety cap: never hold the splash longer than this, even if JS fails. */
    private static final long MAX_SPLASH_MS = 3000;

    /** True while the native splash should stay on screen (first frame + timeout guard). */
    static boolean isFirstFrameReady() {
        return firstFrameReady || (android.os.SystemClock.uptimeMillis() - LAUNCHED_AT) >= MAX_SPLASH_MS;
    }

    @Override
    public void load() {
        instance = this;
    }

    /** Called by the web layer once its first frame is painted. */
    @PluginMethod
    public void markFirstFrame(PluginCall call) {
        firstFrameReady = true;
        call.resolve();
    }

    /** Called by MainActivity for launch and new intents. */
    static void handleIntent(Intent intent) {
        JSObject share = shareFromIntent(intent);
        if (share == null) return;
        if (instance != null && instance.hasListeners("share")) {
            instance.notifyListeners("share", share, true);
        } else {
            pendingShare = share;
        }
    }

    static JSObject shareFromIntent(Intent intent) {
        if (intent == null) return null;
        String action = intent.getAction();
        if (Intent.ACTION_SEND.equals(action)) {
            String type = intent.getType();
            if (type != null && !type.startsWith("text/")) return null;
            CharSequence text = intent.getCharSequenceExtra(Intent.EXTRA_TEXT);
            String subject = intent.getStringExtra(Intent.EXTRA_SUBJECT);
            if (text == null && subject == null) return null;
            JSObject o = new JSObject();
            o.put("title", subject == null ? "" : subject);
            o.put("text", text == null ? "" : text.toString());
            o.put("url", "");
            // Mark consumed so a configuration change does not re-import it.
            intent.setAction(Intent.ACTION_MAIN);
            return o;
        }
        return null;
    }

    @Override
    protected void handleOnDestroy() {
        if (instance == this) instance = null;
    }

    @PluginMethod
    public void getPendingShare(PluginCall call) {
        JSObject s = pendingShare;
        pendingShare = null;
        call.resolve(s == null ? new JSObject() : s);
    }

    @PluginMethod
    public void openUrl(PluginCall call) {
        String url = call.getString("url");
        if (url == null || !(url.startsWith("https://") || url.startsWith("http://"))) {
            call.reject("invalid_url");
            return;
        }
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        i.addCategory(Intent.CATEGORY_BROWSABLE);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        try {
            getActivity().startActivity(i);
            call.resolve();
        } catch (ActivityNotFoundException e) {
            call.reject("no_app");
        }
    }

    @PluginMethod
    public void saveTextFile(PluginCall call) {
        String name = call.getString("name", "reels-organizer-backup.json");
        String mime = call.getString("mime", "application/json");
        pendingSaveText = call.getString("text", "");
        Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        i.addCategory(Intent.CATEGORY_OPENABLE);
        i.setType(mime);
        i.putExtra(Intent.EXTRA_TITLE, name);
        startActivityForResult(call, i, "onSaveResult");
    }

    @ActivityCallback
    private void onSaveResult(PluginCall call, ActivityResult result) {
        if (call == null) return;
        JSObject r = new JSObject();
        Intent data = result.getData();
        if (result.getResultCode() != Activity.RESULT_OK || data == null || data.getData() == null) {
            pendingSaveText = null;
            r.put("saved", false);
            call.resolve(r);
            return;
        }
        Uri uri = data.getData();
        try (OutputStream out = getContext().getContentResolver().openOutputStream(uri, "wt")) {
            if (out == null) throw new IllegalStateException("no stream");
            out.write((pendingSaveText == null ? "" : pendingSaveText).getBytes(StandardCharsets.UTF_8));
            r.put("saved", true);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("write_failed", e);
        } finally {
            pendingSaveText = null;
        }
    }

    @PluginMethod
    public void readClipboard(PluginCall call) {
        JSObject r = new JSObject();
        ClipboardManager cm = (ClipboardManager) getContext().getSystemService(Context.CLIPBOARD_SERVICE);
        String text = "";
        if (cm != null && cm.hasPrimaryClip()) {
            ClipData clip = cm.getPrimaryClip();
            if (clip != null && clip.getItemCount() > 0) {
                CharSequence cs = clip.getItemAt(0).coerceToText(getContext());
                if (cs != null) text = cs.toString();
            }
        }
        r.put("text", text);
        call.resolve(r);
    }

    @PluginMethod
    public void setSystemBars(PluginCall call) {
        final boolean dark = Boolean.TRUE.equals(call.getBoolean("dark", false));
        getActivity().runOnUiThread(() -> {
            Window w = getActivity().getWindow();
            int bg = dark ? Color.parseColor("#141213") : Color.parseColor("#F7F3EF");
            w.setStatusBarColor(bg);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) w.setNavigationBarColor(bg);
            View decor = w.getDecorView();
            WindowInsetsControllerCompat c = WindowCompat.getInsetsController(w, decor);
            c.setAppearanceLightStatusBars(!dark);
            c.setAppearanceLightNavigationBars(!dark);
            decor.setBackgroundColor(bg);
        });
        call.resolve();
    }

    /* ---------------------- Covers / embed metadata --------------------- */

    /** Only instagram.com embed pages may be fetched (no arbitrary URLs). */
    private static boolean isAllowedEmbedUrl(String url) {
        if (url == null) return false;
        Uri u;
        try {
            u = Uri.parse(url);
        } catch (Exception e) {
            return false;
        }
        if (!"https".equals(u.getScheme())) return false;
        String host = u.getHost() == null ? "" : u.getHost().toLowerCase();
        if (!host.equals("instagram.com") && !host.equals("www.instagram.com")) return false;
        String path = u.getPath() == null ? "" : u.getPath();
        return path.contains("/embed");
    }

    /** Cover/avatar images only come from Instagram/Facebook CDNs. */
    private static boolean isAllowedImageHost(String url) {
        if (url == null) return false;
        Uri u;
        try {
            u = Uri.parse(url);
        } catch (Exception e) {
            return false;
        }
        if (!"https".equals(u.getScheme())) return false;
        String host = u.getHost() == null ? "" : u.getHost().toLowerCase();
        return host.endsWith(".cdninstagram.com") || host.endsWith(".fbcdn.net");
    }

    private static class HttpText {
        final int status;
        final String body;
        HttpText(int status, String body) { this.status = status; this.body = body; }
    }

    private static HttpText httpGetText(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(20000);
        c.setRequestProperty("User-Agent", UA);
        c.setInstanceFollowRedirects(true);
        try {
            int status = c.getResponseCode();
            InputStream in = status >= 400 ? c.getErrorStream() : c.getInputStream();
            ByteArrayOutputStream buf = new ByteArrayOutputStream();
            if (in != null) {
                byte[] b = new byte[8192];
                int n;
                while ((n = in.read(b)) > 0) buf.write(b, 0, n);
                in.close();
            }
            return new HttpText(status, buf.toString("UTF-8"));
        } finally {
            c.disconnect();
        }
    }

    /**
     * Fetch the public Instagram embed page (same page the in-app preview
     * iframe uses) so the web layer can read cover/creator/caption from it.
     */
    @PluginMethod
    public void fetchEmbedPage(PluginCall call) {
        String url = call.getString("url");
        if (!isAllowedEmbedUrl(url)) {
            call.reject("invalid_url");
            return;
        }
        io.execute(() -> {
            try {
                HttpText r = httpGetText(url);
                JSObject o = new JSObject();
                o.put("status", r.status);
                o.put("body", r.body);
                call.resolve(o);
            } catch (Exception e) {
                call.reject("network_error", e);
            }
        });
    }

    private File coversDir() {
        File dir = new File(getContext().getFilesDir(), "covers");
        if (!dir.exists()) dir.mkdir();
        return dir;
    }

    /** Download an image, downscale it to maxWidth and store it as WebP. */
    @PluginMethod
    public void downloadImage(PluginCall call) {
        String url = call.getString("url");
        String name = call.getString("name");
        int maxWidth = call.getInt("maxWidth", 480) == null ? 480 : call.getInt("maxWidth", 480);
        if (!isAllowedImageHost(url) || name == null || !name.matches("[A-Za-z0-9._-]+")) {
            call.reject("invalid_url");
            return;
        }
        io.execute(() -> {
            try {
                HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
                c.setConnectTimeout(15000);
                c.setReadTimeout(25000);
                c.setRequestProperty("User-Agent", UA);
                Bitmap bmp;
                try (InputStream in = c.getInputStream()) {
                    BitmapFactory.Options bounds = new BitmapFactory.Options();
                    bounds.inJustDecodeBounds = true;
                    // read the stream fully once; decode from the bytes
                    ByteArrayOutputStream buf = new ByteArrayOutputStream();
                    byte[] b = new byte[8192];
                    int n;
                    while (in != null && (n = in.read(b)) > 0) buf.write(b, 0, n);
                    byte[] data = buf.toByteArray();
                    BitmapFactory.decodeByteArray(data, 0, data.length, bounds);
                    int sample = 1;
                    while (bounds.outWidth / (sample * 2) >= maxWidth) sample *= 2;
                    BitmapFactory.Options opts = new BitmapFactory.Options();
                    opts.inSampleSize = sample;
                    bmp = BitmapFactory.decodeByteArray(data, 0, data.length, opts);
                } finally {
                    c.disconnect();
                }
                if (bmp == null) throw new IllegalStateException("decode_failed");
                if (bmp.getWidth() > maxWidth) {
                    float scale = (float) maxWidth / bmp.getWidth();
                    bmp = Bitmap.createScaledBitmap(bmp, maxWidth, Math.round(bmp.getHeight() * scale), true);
                }
                File out = new File(coversDir(), name);
                try (FileOutputStream fos = new FileOutputStream(out)) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                        bmp.compress(Bitmap.CompressFormat.WEBP_LOSSY, 82, fos);
                    } else {
                        bmp.compress(Bitmap.CompressFormat.WEBP, 82, fos);
                    }
                }
                bmp.recycle();
                JSObject o = new JSObject();
                o.put("path", out.getAbsolutePath());
                o.put("bytes", out.length());
                call.resolve(o);
            } catch (Exception e) {
                call.reject("download_failed", e);
            }
        });
    }

    /** Total size of the stored cover/avatar cache. */
    @PluginMethod
    public void cacheStats(PluginCall call) {
        long bytes = 0;
        File[] files = coversDir().listFiles();
        if (files != null) for (File f : files) if (f.isFile()) bytes += f.length();
        JSObject o = new JSObject();
        o.put("bytes", bytes);
        call.resolve(o);
    }

    /** Delete stored cover/avatar images (reels themselves are kept). */
    @PluginMethod
    public void clearCache(PluginCall call) {
        File[] files = coversDir().listFiles();
        if (files != null) for (File f : files) if (f.isFile()) f.delete();
        call.resolve();
    }

    /** Short vibration tick for button presses (capped at 30ms). */
    @PluginMethod
    public void haptic(PluginCall call) {
        Integer msBoxed = call.getInt("ms", 8);
        int ms = Math.min(msBoxed == null ? 8 : msBoxed, 30);
        try {
            android.os.Vibrator v = (android.os.Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
            if (v == null) {
                call.resolve();
                return;
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(android.os.VibrationEffect.createOneShot(ms, android.os.VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                v.vibrate(ms);
            }
        } catch (Exception ignored) {
            // haptics are best-effort
        }
        call.resolve();
    }
}
