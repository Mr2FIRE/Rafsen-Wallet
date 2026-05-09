<<<<<<< HEAD
package com.rafsen.wallet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

/**
 * Rafsen Wallet Backend - Spring Boot Application
 * 
 * This is the main entry point for the Java backend that serves as a secure bridge
 * between the React frontend and the blockchain node's JSON-RPC interface.
 * 
 * The application exposes REST endpoints for wallet operations:
 * - GET  /api/info      - Fetch wallet info (balance, blocks, peers)
 * - GET  /api/address   - Generate new receiving address
 * - POST /api/send      - Send funds (API key protected)
 * - GET  /api/history   - Fetch transaction history
 * 
 * @author Rafsen Wallet Team
 * @version 1.0.0
 */
@SpringBootApplication
@ComponentScan(basePackages = {"com.rafsen.wallet"})
public class RafsenWalletApplication {

    public static void main(String[] args) {
        SpringApplication.run(RafsenWalletApplication.class, args);
    }
}
=======
package com.rafsen.wallet;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

/**
 * Rafsen Wallet Backend - Spring Boot Application
 * 
 * This is the main entry point for the Java backend that serves as a secure bridge
 * between the React frontend and the blockchain node's JSON-RPC interface.
 * 
 * The application exposes REST endpoints for wallet operations:
 * - GET  /api/info      - Fetch wallet info (balance, blocks, peers)
 * - GET  /api/address   - Generate new receiving address
 * - POST /api/send      - Send funds (API key protected)
 * - GET  /api/history   - Fetch transaction history
 * 
 * @author Rafsen Wallet Team
 * @version 1.0.0
 */
@SpringBootApplication
@ComponentScan(basePackages = {"com.rafsen.wallet"})
public class RafsenWalletApplication {

    public static void main(String[] args) {
        SpringApplication.run(RafsenWalletApplication.class, args);
    }
}
>>>>>>> 99abe21d59876c63d44da7729f354b6d0c1fda35
