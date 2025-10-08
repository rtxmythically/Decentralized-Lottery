# Decentralized Lottery DApp (Frontend)

This repository contains the **frontend interface** for the Decentralized Lottery system — a fully on-chain and transparent lottery running on the **Ethereum Sepolia Testnet**.  
It allows users to connect their wallet, participate in the lottery by paying **0.01 ETH**, and view live on-chain data such as participants, prize pool, and winners.

> **Smart Contract Repository:**  
> [Decentralized-Lottery-SmartContract-Hardhatt](https://github.com/rtxmythically/Decentralized-Lottery-SmartContract-Hardhatt)

> **Live Application:**  
> [https://decentralized-lottery.web.app/](https://decentralized-lottery.web.app/)

---

## Overview

The frontend is built with **React** and **Ethers.js**, directly interacting with the deployed smart contract on the **Sepolia test network**.  
All data — including participants, entry fee, and winners — is fetched directly from the blockchain, ensuring full transparency and decentralization.

---

## Features

- Connect wallet via **MetaMask**
- Enter the lottery by paying **0.01 ETH**
- Display current participants in real time
- Show the contract balance and entry fee
- View the most recent winner
- Live updates triggered by blockchain events
- Deployed and hosted on **Firebase**

---

## Smart Contract Details

- **Network:** Ethereum Sepolia Testnet  
- **Contract Address:** `0x9FDBBBeda4495fc63A2E90886D6EDeFf52343233`  
- **Entry Fee:** `0.01 ETH`

---

## Tech Stack

- **Framework:** React  
- **Blockchain SDK:** Ethers.js  
- **Network:** Ethereum Sepolia Testnet  
- **Deployment:** Firebase Hosting  

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/rtxmythically/decentralized-lottery.git
cd decentralized-lottery
