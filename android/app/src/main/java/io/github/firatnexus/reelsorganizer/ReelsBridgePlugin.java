package io.github.firatnexus.reelsorganizer;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
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

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/**
 * Small native bridge for Sakla (Reels Organizer).
 *
 * - Receives text shared from other apps (Instagram "Share" -> Reels Organizer).
 * - Opens links with ACTION_VIEW so instagram.com links go to the Instagram app.
 * - Saves backup files through the system "Save as" dialog (Storage Access Framework).
 * - Reads the clipboard and colors the system bars.
 *
 * It never reads Instagram data, cookies or accounts.
 */
@CapacitorPlugin(name = "ReelsBridge")
public class ReelsBridgePlugin extends Plugin {

    private static JSObject pendingShare;
    private static ReelsBridgePlugin instance;
    private String pendingSaveText;

    @Override
    public void load() {
        instance = this;
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
}
