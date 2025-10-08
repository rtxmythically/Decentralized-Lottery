import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import LotteryArtifact from "./abi/Lottery.json";
import "./App.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MetaMaskInpageProvider } from "@metamask/providers";

const CONTRACT_ADDRESS = "0x9FDBBBeda4495fc63A2E90886D6EDeFf52343233";
const ENTRY_FEE = ethers.parseEther("0.01");
const SEPOLIA_CHAIN_ID = "11155111";

interface EthereumError extends Error {
    code?: number;
    reason?: string;
}

function App() {
    const [signer, setSigner] = useState<ethers.Signer | null>(null);
    const [contract, setContract] = useState<ethers.Contract | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState<boolean>(false);
    const [lotteryOpen, setLotteryOpen] = useState<boolean>(false);
    const [players, setPlayers] = useState<string[]>([]);
    const [winner, setWinner] = useState<string | null>(null);
    const [isMember, setIsMember] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [isCorrectNetwork, setIsCorrectNetwork] = useState<boolean>(true);
    const [balance, setBalance] = useState<string>("0");
    const [pendingVRF, setPendingVRF] = useState<boolean>(false);
    const [endTime, setEndTime] = useState<number>(0);
    const [timeLeft, setTimeLeft] = useState<string>("");

    const checkNetwork = async (provider: ethers.BrowserProvider): Promise<boolean> => {
        try {
            const network = await provider.getNetwork();
            const chainId = network.chainId.toString();
            if (chainId !== SEPOLIA_CHAIN_ID) {
                setIsCorrectNetwork(false);
                setError("Please switch to Sepolia Testnet");
                return false;
            }
            setIsCorrectNetwork(true);
            setError(null);
            return true;
        } catch (err: unknown) {
            const error = err as EthereumError;
            setError(`Network check failed: ${error.message}`);
            return false;
        }
    };

    const switchNetwork = async (): Promise<boolean> => {
        try {
            await window.ethereum?.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: `0x${Number(SEPOLIA_CHAIN_ID).toString(16)}` }],
            });
            return true;
        } catch (err: unknown) {
            const error = err as EthereumError;
            if (error.code === 4902) {
                try {
                    await window.ethereum?.request({
                        method: "wallet_addEthereumChain",
                        params: [
                            {
                                chainId: `0x${Number(SEPOLIA_CHAIN_ID).toString(16)}`,
                                chainName: "Sepolia Testnet",
                                rpcUrls: ["https://rpc.sepolia.org"],
                                nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
                                blockExplorerUrls: ["https://sepolia.etherscan.io"],
                            },
                        ],
                    });
                    return true;
                } catch (addErr: unknown) {
                    const addError = addErr as EthereumError;
                    setError(`Failed to add Sepolia network: ${addError.message}`);
                    return false;
                }
            }
            setError(`Failed to switch network: ${error.message}`);
            return false;
        }
    };

    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            toast.error("Please install MetaMask!");
            return;
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum as MetaMaskInpageProvider);
            await provider.send("eth_requestAccounts", []);
            if (!(await switchNetwork())) return;
            if (!(await checkNetwork(provider))) return;

            const signer = await provider.getSigner();
            const account = await signer.getAddress();
            const contract = new ethers.Contract(CONTRACT_ADDRESS, LotteryArtifact.abi, signer);

            setSigner(signer);
            setAccount(account);
            setContract(contract);

            const owner = await contract.owner();
            setIsOwner(account.toLowerCase() === owner.toLowerCase());

            await updateState(contract, account);
            toast.success("Wallet connected successfully!");
        } catch (err: unknown) {
            const error = err as EthereumError;
            toast.error(error.code === 4001 ? "User rejected request" : `Failed to connect wallet: ${error.message}`);
        }
    }, []);

    const updateState = async (contract: ethers.Contract, account: string) => {
        try {
            const open = await contract.lotteryOpen();
            const players = await contract.getPlayers();
            const winner = await contract.winner();
            const isMember = await contract.isMember(account);
            const balance = await contract.getBalance();
            const pendingVRF = await contract.pendingVRF();
            const endTime = await contract.endTime();

            setLotteryOpen(open as boolean);
            setPlayers(players as string[]);
            setWinner((winner as string) === ethers.ZeroAddress ? null : (winner as string));
            setIsMember(isMember as boolean);
            setBalance(ethers.formatEther(balance as ethers.BigNumberish));
            setPendingVRF(pendingVRF as boolean);
            setEndTime(Number(endTime as ethers.BigNumberish));
        } catch (err: unknown) {
            const error = err as EthereumError;
            toast.error(`Failed to update state: ${error.message}`);
        }
    };

    const enterLottery = async () => {
        if (!contract || !signer || !isCorrectNetwork) return;
        setLoading(true);
        setError(null);
        try {
            const tx = await contract.enter({ value: ENTRY_FEE });
            await tx.wait();
            await updateState(contract, account!);
            toast.success("Entered lottery successfully!");
        } catch (err: unknown) {
            const error = err as EthereumError;
            toast.error(
                error.code === 4001
                    ? "Transaction rejected by user"
                    : error.code === -32603
                    ? "Insufficient funds or transaction failed"
                    : `Failed to enter lottery: ${error.message}`
            );
        }
        setLoading(false);
    };

    const startLottery = async () => {
        if (!contract || !signer || !isCorrectNetwork) return;
        setLoading(true);
        setError(null);
        try {
            const tx = await contract.startLottery();
            await tx.wait();
            await updateState(contract, account!);
            toast.success("Lottery started successfully!");
        } catch (err: unknown) {
            const error = err as EthereumError;
            toast.error(
                error.code === 4001 ? "Transaction rejected by user" : `Failed to start lottery: ${error.message}`
            );
        }
        setLoading(false);
    };

    const endLottery = async () => {
        if (!contract || !signer || !isCorrectNetwork) return;
        setLoading(true);
        setError(null);
        try {
            const tx = await contract.endLottery();
            await tx.wait();
            await updateState(contract, account!);
            toast.info("Lottery ended, waiting for VRF callback...");
        } catch (err: unknown) {
            const error = err as EthereumError;
            toast.error(
                error.code === 4001 ? "Transaction rejected by user" : `Failed to end lottery: ${error.message}`
            );
        }
        setLoading(false);
    };

    const withdrawPrize = async () => {
        if (!contract || !signer || !isCorrectNetwork) return;
        setLoading(true);
        setError(null);
        try {
            const tx = await contract.withdrawPrize();
            await tx.wait();
            await updateState(contract, account!);
            toast.success("Prize withdrawn successfully!");
        } catch (err: unknown) {
            const error = err as EthereumError;
            toast.error(
                error.code === 4001 ? "Transaction rejected by user" : `Failed to withdraw prize: ${error.message}`
            );
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!contract || !account) return;
        const onEntered = () => updateState(contract, account);
        const onLotteryStarted = () => updateState(contract, account);
        const onLotteryEnded = () => updateState(contract, account);
        const onPrizeWithdrawn = () => updateState(contract, account);

        contract.on("Entered", onEntered);
        contract.on("LotteryStarted", onLotteryStarted);
        contract.on("LotteryEnded", onLotteryEnded);
        contract.on("PrizeWithdrawn", onPrizeWithdrawn);

        return () => {
            contract.off("Entered", onEntered);
            contract.off("LotteryStarted", onLotteryStarted);
            contract.off("LotteryEnded", onLotteryEnded);
            contract.off("PrizeWithdrawn", onPrizeWithdrawn);
        };
    }, [contract, account]);

    useEffect(() => {
        if (!window.ethereum || !contract || !account || !pendingVRF) return;
        const interval = setInterval(async () => {
            try {
                const winner = await contract.winner();
                if (winner !== ethers.ZeroAddress) {
                    setWinner(winner as string);
                    setPendingVRF(false);
                    toast.success("Winner selected!");
                    clearInterval(interval);
                }
            } catch (err: unknown) {
                const error = err as EthereumError;
                toast.error(`Failed to check winner: ${error.message}`);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [contract, account, pendingVRF]);

    useEffect(() => {
        if (!window.ethereum) return;

        const handleChainChanged = async () => {
            const provider = new ethers.BrowserProvider(window.ethereum as MetaMaskInpageProvider);
            if (!(await checkNetwork(provider))) return;
            await connectWallet();
        };

        const handleAccountsChanged = async (accounts: string[]) => {
            if (accounts.length === 0) {
                setAccount(null);
                setSigner(null);
                setContract(null);
                toast.error("No accounts detected");
            } else {
                await connectWallet();
            }
        };

        window.ethereum.on("chainChanged", handleChainChanged);
        window.ethereum.on("accountsChanged", async (...args: unknown[]) => {
            const accounts = args[0] as string[];
            await handleAccountsChanged(accounts);
        });

        return () => {
            window.ethereum?.removeListener("chainChanged", handleChainChanged);
            window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
        };
    }, [connectWallet]);

    useEffect(() => {
        if (!lotteryOpen || endTime === 0) {
            setTimeLeft("");
            return;
        }
        const updateTimeLeft = () => {
            const now = Math.floor(Date.now() / 1000);
            const timeRemaining = endTime - now;
            if (timeRemaining <= 0) {
                setTimeLeft("Lottery ended, awaiting results...");
                return;
            }
            const hours = Math.floor(timeRemaining / 3600);
            const minutes = Math.floor((timeRemaining % 3600) / 60);
            const seconds = timeRemaining % 60;
            setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        };
        updateTimeLeft();
        const interval = setInterval(updateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [lotteryOpen, endTime]);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
            <h1 className="text-3xl font-bold mb-4">Decentralized Lottery</h1>
            {!account ? (
                <button
                    onClick={connectWallet}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Connect Wallet
                </button>
            ) : !isCorrectNetwork ? (
                <p className="text-red-500">Please switch to Sepolia Testnet</p>
            ) : (
                <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-md">
                    <p className="text-sm mb-2">Account: {account.slice(0, 6)}...{account.slice(-4)}</p>
                    <p className="text-sm mb-2">Is Owner: {isOwner ? "Yes" : "No"}</p>
                    <p className="text-sm mb-2">Lottery Open: {lotteryOpen ? "Yes" : "No"}</p>
                    <p className="text-sm mb-2">Prize Pool: {balance} ETH</p>
                    <p className="text-sm mb-2">
                        Winner: {winner ? `${winner.slice(0, 6)}...${winner.slice(-4)}` : "None"}
                    </p>
                    <p className="text-sm mb-2">Players: {players.length}</p>
                    {lotteryOpen && timeLeft && (
                        <p className="text-sm mb-2">Time Left: {timeLeft}</p>
                    )}
                    {pendingVRF && (
                        <p className="text-yellow-500 text-sm mb-2">Waiting for VRF callback...</p>
                    )}
                    <ul className="text-sm mb-4 list-disc list-inside">
                        {players.map((player, i) => (
                            <li key={i}>
                                {player.slice(0, 6)}...{player.slice(-4)}
                            </li>
                        ))}
                    </ul>

                    {!isMember && lotteryOpen && (
                        <button
                            onClick={enterLottery}
                            disabled={loading}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400 w-full mb-2"
                        >
                            {loading ? "Processing..." : "Enter Lottery (0.01 ETH)"}
                        </button>
                    )}

                    {isOwner && !lotteryOpen && (
                        <button
                            onClick={startLottery}
                            disabled={loading}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 w-full mb-2"
                        >
                            {loading ? "Processing..." : "Start Lottery"}
                        </button>
                    )}

                    {isOwner && lotteryOpen && (
                        <button
                            onClick={endLottery}
                            disabled={loading}
                            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400 w-full mb-2"
                        >
                            {loading ? "Processing..." : "End Lottery (Manual)"}
                        </button>
                    )}

                    {winner === account && (
                        <button
                            onClick={withdrawPrize}
                            disabled={loading}
                            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:bg-gray-400 w-full mb-2"
                        >
                            {loading ? "Processing..." : "Withdraw Prize"}
                        </button>
                    )}

                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                </div>
            )}
        </div>
    );
}

export default App;
