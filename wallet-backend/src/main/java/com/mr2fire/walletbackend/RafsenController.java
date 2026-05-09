package com.mr2fire.walletbackend; // Make sure this matches your folder structure!

import org.springframework.web.bind.annotation.*;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173") // <-- THE REACT VIP PASS
@RequestMapping("/api")
public class RafsenController {

    @GetMapping("/info")
    public String getInfo() { return sendRpc("getinfo", "[]"); }

    @GetMapping("/address")
    public String getAddress() { return sendRpc("getnewaddress", "[]"); }

    @GetMapping("/history")
    public String getHistory() { return sendRpc("listtransactions", "[\"*\", 10]"); }

    @PostMapping("/send")
    public String sendFunds(@RequestBody Map<String, Object> payload) {
        String address = (String) payload.get("address");
        Object amount = payload.get("amount");
        return sendRpc("sendtoaddress", "[\"" + address + "\", " + amount + "]");
    }

    // 1. Ask the blockchain for our unspent bills (UTXOs)
    @PostMapping("/utxos")
    public String getUtxos(@RequestBody Map<String, String> payload) {
        String address = payload.get("address");
        // Secret trick: Tell the node to secretly "watch" this offline address
        sendRpc("importaddress", "[\"" + address + "\", \"\", false]");
        return sendRpc("listunspent", "[0, 9999999, [\"" + address + "\"]]");
    }

    // 2. Fetch the raw hex of a previous transaction (required for strict offline signing)
    @PostMapping("/getrawtx")
    public String getRawTx(@RequestBody Map<String, String> payload) {
        return sendRpc("getrawtransaction", "[\"" + payload.get("txid") + "\"]");
    }

    // 3. The Megaphone: Broadcast the signed math to the world
    @PostMapping("/broadcast")
    public String broadcastTx(@RequestBody Map<String, String> payload) {
        return sendRpc("sendrawtransaction", "[\"" + payload.get("rawtx") + "\"]");
    }

    // THE DIRECT BRIDGE TO GERMANY
    private String sendRpc(String method, String params) {
        try {
            String auth = Base64.getEncoder().encodeToString("mr2fire:fire2004".getBytes());
            String body = "{\"jsonrpc\":\"1.0\",\"id\":\"mr2fire\",\"method\":\"" + method + "\",\"params\":" + params + "}";
            
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://144.91.113.101:18776"))
                .header("Authorization", "Basic " + auth)
                .header("Content-Type", "text/plain")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

            return HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString()).body();
        } catch (Exception e) { return "{\"error\":\"" + e.getMessage() + "\"}"; }
    }
}