# Decentralized Lottery DApp (Frontend)

This repository contains the **frontend interface** for the Decentralized Lottery system — a fully on-chain and transparent lottery running on the **Ethereum Sepolia Testnet**.  
It allows users to connect their wallet, participate in the lottery, and view live on-chain data such as participants, prize pool, and winners.

> **Smart Contract Repository:**  
> [Decentralized-Lottery-SmartContract-Hardhatt](https://github.com/rtxmythically/Decentralized-Lottery-SmartContract-Hardhatt)

> **Live Application:**  
> [https://decentralized-lottery.web.app/](https://decentralized-lottery.web.app/)

---

## Overview

The frontend is built with **React** and **Ethers.js**, directly interacting with the deployed smart contract on the Sepolia test network.  
It does not rely on any centralized backend — all information is retrieved directly from the blockchain.  
The project demonstrates how decentralized applications can provide transparency and fairness in lottery systems.

---

## Features

- Connect wallet via **MetaMask**
- Enter the lottery by paying the entry fee
- Display current participants in real time
- Show the contract balance and entry cost
- View the latest winner
- Live updates triggered by blockchain events
- Deployed and hosted on **Firebase**

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
