package com.oreac.astrokabbale;

import android.content.Context;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.print.PageRange;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.util.Base64;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.FileOutputStream;
import java.io.IOException;

@CapacitorPlugin(name = "OreacPrint")
public class OreacPrintPlugin extends Plugin {
    @PluginMethod
    public void printHtml(PluginCall call) {
        String name = call.getString("name", "OREAC Astro Kabbale");
        getActivity().runOnUiThread(() -> {
            try {
                PrintManager manager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                PrintDocumentAdapter adapter = getBridge().getWebView().createPrintDocumentAdapter(name);
                manager.print(name, adapter, new PrintAttributes.Builder().build());
                call.resolve();
            } catch (Exception error) {
                call.reject("Impossible d'ouvrir l'impression", error);
            }
        });
    }

    @PluginMethod
    public void printPdf(PluginCall call) {
        String encoded = call.getString("data");
        if (encoded == null || encoded.isEmpty()) {
            call.reject("Le PDF est vide");
            return;
        }
        byte[] pdf;
        try {
            pdf = Base64.decode(encoded, Base64.DEFAULT);
        } catch (IllegalArgumentException error) {
            call.reject("Le PDF est invalide", error);
            return;
        }
        if (pdf.length < 5 || pdf[0] != '%' || pdf[1] != 'P' || pdf[2] != 'D' || pdf[3] != 'F' || pdf[4] != '-') {
            call.reject("Le PDF est invalide");
            return;
        }
        String name = call.getString("name", "OREAC_Astro_Kabbale.pdf");
        getActivity().runOnUiThread(() -> {
            try {
                PrintManager manager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                PrintDocumentAdapter adapter = new PrintDocumentAdapter() {
                    @Override
                    public void onLayout(PrintAttributes oldAttributes, PrintAttributes newAttributes,
                            CancellationSignal cancellationSignal, LayoutResultCallback callback, Bundle extras) {
                        PrintDocumentInfo info = new PrintDocumentInfo.Builder(name)
                                .setContentType(PrintDocumentInfo.CONTENT_TYPE_DOCUMENT)
                                .setPageCount(PrintDocumentInfo.PAGE_COUNT_UNKNOWN)
                                .build();
                        callback.onLayoutFinished(info, true);
                    }

                    @Override
                    public void onWrite(PageRange[] pages, ParcelFileDescriptor destination,
                            CancellationSignal cancellationSignal, WriteResultCallback callback) {
                        try (FileOutputStream output = new FileOutputStream(destination.getFileDescriptor())) {
                            output.write(pdf);
                            callback.onWriteFinished(new PageRange[] { PageRange.ALL_PAGES });
                        } catch (IOException error) {
                            callback.onWriteFailed(error.getMessage());
                        }
                    }
                };
                PrintAttributes attributes = new PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                        .build();
                manager.print(name, adapter, attributes);
                call.resolve();
            } catch (Exception error) {
                call.reject("Impossible d'ouvrir le PDF", error);
            }
        });
    }
}
