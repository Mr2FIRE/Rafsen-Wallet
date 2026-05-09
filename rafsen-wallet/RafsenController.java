<<<<<<< HEAD
package com.rafsen.wallet.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;

import java.util.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api")
public class RafsenController {

    @Value("${rpc.host:http://localhost}")
    private String rpcHost;

    @Value("${rpc.port:18776}")
    private String rpcPort;

    @Value("${rpc.user:bitcoin}")
    private String rpcUser;

    @Value("${rpc.password:password}")
    private String rpcPassword;

    @Value("${api.key:dev-key-123456789}")
    private String validApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Validates the API key from request headers
     */
    private boolean validateApiKey(String apiKey) {
        return apiKey != null && apiKey.equals(validApiKey);
    }

    /**
     * Helper method to make RPC calls to the blockchain node
     */
    private JsonNode callRPC(String method, Object... params) throws Exception {
        String rpcUrl = rpcHost + ":" + rpcPort;

        // Create the JSON-RPC request
        Map<String, Object> rpcRequest = new LinkedHashMap<>();
        rpcRequest.put("jsonrpc", "2.0");
        rpcRequest.put("id", 1);
        rpcRequest.put("method", method);
        rpcRequest.put("params", Arrays.asList(params));

        // Create headers with Basic Auth
        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        String auth = rpcUser + ":" + rpcPassword;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
        headers.set("Authorization", "Basic " + encodedAuth);

        // Make the request
        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(rpcRequest), headers);

        try {
            String response = restTemplate.postForObject(rpcUrl, entity, String.class);
            return objectMapper.readTree(response);
        } catch (RestClientException e) {
            throw new RuntimeException("Blockchain node unreachable. Please check if the Rafsen daemon is running.");
        }
    }

    /**
     * GET /api/info - Fetch wallet info (balance, blocks, connections)
     */
    @GetMapping("/info")
    public ResponseEntity<?> getWalletInfo() {
        try {
            JsonNode result = callRPC("getinfo");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Node Error: " + e.getMessage()));
        }
    }

    /**
     * GET /api/address - Generate a new receiving address
     */
    @GetMapping("/address")
    public ResponseEntity<?> generateNewAddress() {
        try {
            JsonNode result = callRPC("getnewaddress");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Node Error: " + e.getMessage()));
        }
    }

    /**
     * POST /api/send - Send funds to an address (REQUIRES API KEY)
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendFunds(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @RequestBody SendRequest request) {

        // Validate API key
        if (!validateApiKey(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized: Invalid or missing API key"));
        }

        // Validate input
        if (request.getDestinationAddress() == null || request.getDestinationAddress().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Destination address is required"));
        }

        if (request.getAmount() == null || request.getAmount() <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Amount must be greater than 0"));
        }

        try {
            // Call sendtoaddress RPC with: address, amount
            JsonNode result = callRPC("sendtoaddress", request.getDestinationAddress(), request.getAmount());

            // Check if RPC returned an error
            if (result.has("error") && !result.get("error").isNull()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(result.get("error"));
            }

            // Return the transaction ID
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "txid", result.get("result").asText(),
                    "message", "Transaction sent successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send transaction: " + e.getMessage()));
        }
    }

    /**
     * GET /api/history - Fetch transaction history
     */
    @GetMapping("/history")
    public ResponseEntity<?> getTransactionHistory() {
        try {
            // Call listtransactions with: account (empty string = all), count (limit), skip
            JsonNode result = callRPC("listtransactions", "", 100, 0);

            // Check if RPC returned an error
            if (result.has("error") && !result.get("error").isNull()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(result.get("error"));
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Node Error: " + e.getMessage()));
        }
    }

    /**
     * POST /api/export - Export private key (REQUIRES API KEY)
     */
    @PostMapping("/export")
    public ResponseEntity<?> exportPrivateKey(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @RequestBody Map<String, String> body) {
        
        if (!validateApiKey(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        String address = body.get("address");
        try {
            JsonNode result = callRPC("dumpprivkey", address);
            if (result.has("error") && !result.get("error").isNull()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result.get("error"));
            }
            return ResponseEntity.ok(Map.of("privateKey", result.get("result").asText()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Node Error: " + e.getMessage()));
        }
    }

    /**
     * Request DTO for send funds endpoint
     */
    public static class SendRequest {
        private String destinationAddress;
        private Double amount;

        public String getDestinationAddress() {
            return destinationAddress;
        }

        public void setDestinationAddress(String destinationAddress) {
            this.destinationAddress = destinationAddress;
        }

        public Double getAmount() {
            return amount;
        }

        public void setAmount(Double amount) {
            this.amount = amount;
        }
    }
}
=======
package com.rafsen.wallet.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;

import java.util.*;

@CrossOrigin(origins = "http://localhost:5173")
@RestController
@RequestMapping("/api")
public class RafsenController {

    @Value("${rpc.host:http://localhost}")
    private String rpcHost;

    @Value("${rpc.port:18776}")
    private String rpcPort;

    @Value("${rpc.user:bitcoin}")
    private String rpcUser;

    @Value("${rpc.password:password}")
    private String rpcPassword;

    @Value("${api.key:dev-key-123456789}")
    private String validApiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Validates the API key from request headers
     */
    private boolean validateApiKey(String apiKey) {
        return apiKey != null && apiKey.equals(validApiKey);
    }

    /**
     * Helper method to make RPC calls to the blockchain node
     */
    private JsonNode callRPC(String method, Object... params) throws Exception {
        String rpcUrl = rpcHost + ":" + rpcPort;

        // Create the JSON-RPC request
        Map<String, Object> rpcRequest = new LinkedHashMap<>();
        rpcRequest.put("jsonrpc", "2.0");
        rpcRequest.put("id", 1);
        rpcRequest.put("method", method);
        rpcRequest.put("params", Arrays.asList(params));

        // Create headers with Basic Auth
        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        String auth = rpcUser + ":" + rpcPassword;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
        headers.set("Authorization", "Basic " + encodedAuth);

        // Make the request
        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(rpcRequest), headers);

        try {
            String response = restTemplate.postForObject(rpcUrl, entity, String.class);
            return objectMapper.readTree(response);
        } catch (RestClientException e) {
            throw new RuntimeException("Blockchain node unreachable. Please check if the Rafsen daemon is running.");
        }
    }

    /**
     * GET /api/info - Fetch wallet info (balance, blocks, connections)
     */
    @GetMapping("/info")
    public ResponseEntity<?> getWalletInfo() {
        try {
            JsonNode result = callRPC("getinfo");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Node Error: " + e.getMessage()));
        }
    }

    /**
     * GET /api/address - Generate a new receiving address
     */
    @GetMapping("/address")
    public ResponseEntity<?> generateNewAddress() {
        try {
            JsonNode result = callRPC("getnewaddress");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Node Error: " + e.getMessage()));
        }
    }

    /**
     * POST /api/send - Send funds to an address (REQUIRES API KEY)
     */
    @PostMapping("/send")
    public ResponseEntity<?> sendFunds(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @RequestBody SendRequest request) {

        // Validate API key
        if (!validateApiKey(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Unauthorized: Invalid or missing API key"));
        }

        // Validate input
        if (request.getDestinationAddress() == null || request.getDestinationAddress().isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Destination address is required"));
        }

        if (request.getAmount() == null || request.getAmount() <= 0) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Amount must be greater than 0"));
        }

        try {
            // Call sendtoaddress RPC with: address, amount
            JsonNode result = callRPC("sendtoaddress", request.getDestinationAddress(), request.getAmount());

            // Check if RPC returned an error
            if (result.has("error") && !result.get("error").isNull()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(result.get("error"));
            }

            // Return the transaction ID
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "txid", result.get("result").asText(),
                    "message", "Transaction sent successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send transaction: " + e.getMessage()));
        }
    }

    /**
     * GET /api/history - Fetch transaction history
     */
    @GetMapping("/history")
    public ResponseEntity<?> getTransactionHistory() {
        try {
            // Call listtransactions with: account (empty string = all), count (limit), skip
            JsonNode result = callRPC("listtransactions", "", 100, 0);

            // Check if RPC returned an error
            if (result.has("error") && !result.get("error").isNull()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(result.get("error"));
            }

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Node Error: " + e.getMessage()));
        }
    }

    /**
     * POST /api/export - Export private key (REQUIRES API KEY)
     */
    @PostMapping("/export")
    public ResponseEntity<?> exportPrivateKey(
            @RequestHeader(value = "X-API-Key", required = false) String apiKey,
            @RequestBody Map<String, String> body) {
        
        if (!validateApiKey(apiKey)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }

        String address = body.get("address");
        try {
            JsonNode result = callRPC("dumpprivkey", address);
            if (result.has("error") && !result.get("error").isNull()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(result.get("error"));
            }
            return ResponseEntity.ok(Map.of("privateKey", result.get("result").asText()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Node Error: " + e.getMessage()));
        }
    }

    /**
     * Request DTO for send funds endpoint
     */
    public static class SendRequest {
        private String destinationAddress;
        private Double amount;

        public String getDestinationAddress() {
            return destinationAddress;
        }

        public void setDestinationAddress(String destinationAddress) {
            this.destinationAddress = destinationAddress;
        }

        public Double getAmount() {
            return amount;
        }

        public void setAmount(Double amount) {
            this.amount = amount;
        }
    }
}
>>>>>>> 99abe21d59876c63d44da7729f354b6d0c1fda35
