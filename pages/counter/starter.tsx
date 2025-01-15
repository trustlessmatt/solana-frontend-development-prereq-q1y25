import React, { useState, useEffect } from "react";
import * as web3 from "@solana/web3.js";
import { toast } from "react-toastify";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { ExternalLinkIcon } from "@heroicons/react/outline";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet"; // used for making the web3.js wallet compatible with anchor
import CounterIDL from "../../programs/idls/counter.json"; // IDL of the program
import { Counter } from "../../programs/types/counter"; // provides typing for the program
import { Keypair, PublicKey } from "@solana/web3.js";
import BoilerPlate from "../../components/BoilerPlate";

const Starter = () => {
  const [counterKey, setCounterKey] = useState(""); // used to store the public key of the counter
  const [count, setCount] = useState(0);
  const [txSig, setTxSig] = useState("");

  const { connection } = useConnection();
  const { publicKey, wallet } = useWallet();

  const provider = new AnchorProvider(
    connection,
    wallet?.adapter as unknown as NodeWallet,
    AnchorProvider.defaultOptions()
  );

  // create a program instance to interact in TS
  const counterProgram = new Program(
    CounterIDL as unknown as Counter,
    provider
  );

  const getPreparedTransaction = async () => {
    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();
    const txInfo = {
      feePayer: publicKey,
      blockhash: blockhash,
      lastValidBlockHeight: lastValidBlockHeight,
    };
    const transaction = new web3.Transaction(txInfo);
    return transaction;
  };

  const handleInitializeCounter = async () => {
    if (!publicKey || !connection) {
      toast.error("Wallet not connected");
      return;
    }

    // prepare program instructions and transaction
    const transaction = await getPreparedTransaction();
    // generate a new keypair for the counter to interact with the program
    // could pass in a keypair that's already interacted with the program and is already in an altered state
    const counter = Keypair.generate();
    const instruction = await counterProgram.methods
      .initialize() // call the initialize method on the program
      .accounts({
        payer: publicKey, // our wallet is the payer
        counter: counter.publicKey, // the counter account
      })
      .instruction();

    transaction.add(instruction);

    try {
      const signature = await provider.sendAndConfirm(
        transaction, // prebuilt transaction
        [counter], // signer account; our wallet is added automatically
        {
          skipPreflight: true, // skip the preflight check
        }
      );

      setTxSig(signature);
      setCounterKey(counter.publicKey.toBase58());
    } catch (error) {
      console.error(error);
      toast.error("Failed to initialize counter");
    }
  };

  const handleIncrementCounter = async () => {
    if (!publicKey || !connection) {
      toast.error("Wallet not connected");
      return;
    }

    const transaction = await getPreparedTransaction();
    const instruction = await counterProgram.methods
      .increment() // call the increment method
      .accounts({
        // do not need to specify the payer account as no account is being created
        counter: new PublicKey(counterKey),
      })
      .instruction();
    transaction.add(instruction);

    try {
      const signature = await provider.sendAndConfirm(
        transaction,
        [], // do not need to add the counter account as it's already initialized
        {
          skipPreflight: true,
        }
      );
      setTxSig(signature);
    } catch (error) {
      console.error(error);
      toast.error("Failed to increment counter");
    }
  };

  const handleDecrementCounter = async () => {
    if (!publicKey || !connection) {
      toast.error("Wallet not connected");
      return;
    }

    const transaction = await getPreparedTransaction();
    const instruction = await counterProgram.methods
      .decrement()
      .accounts({
        counter: new PublicKey(counterKey),
      })
      .instruction();
    transaction.add(instruction);

    try {
      const signature = await provider.sendAndConfirm(transaction, [], {
        skipPreflight: true,
      });
      setTxSig(signature);
    } catch (error) {
      console.error(error);
      toast.error("Failed to decrement counter");
    }
  };

  useEffect(() => {
    const checkCounter = async () => {
      if (connection && counterKey && publicKey) {
        try {
          // go to the counter program, access the counter account, fetch the count
          const currentCount = await counterProgram.account.counter.fetch(
            new PublicKey(counterKey)
          );
          setCount(currentCount.count);
        } catch (error) {
          console.error(error);
        }
      }
    };
    checkCounter();
  }, [counterKey, publicKey, connection, txSig]);

  const outputs = [
    {
      title: "Counter Value...",
      dependency: count,
    },
    {
      title: "Latest Transaction Signature...",
      dependency: txSig,
      href: `https://explorer.solana.com/tx/${txSig}?cluster=devnet`,
    },
  ];

  return (
    <main className="min-h-screen text-white max-w-7xl">
      <section className="grid grid-cols-1 sm:grid-cols-6 gap-4 p-4">
        <form className="rounded-lg min-h-content p-4 bg-[#2a302f] sm:col-span-6 lg:col-start-2 lg:col-end-6">
          <div className="flex justify-between items-center">
            <h2 className="font-bold text-2xl text-[#fa6ece]">
              Create Counter 💸
            </h2>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <button
              onClick={(e) => {
                e.preventDefault();
                handleInitializeCounter();
              }}
              disabled={!publicKey}
              className={`disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#fa6ece] bg-[#fa6ece] 
                rounded-lg w-auto py-1 font-semibold transition-all duration-200 hover:bg-transparent 
                border-2 border-transparent hover:border-[#fa6ece]`}
            >
              Initialize Counter
            </button>
            {counterKey && (
              <p className="text-sm text-gray-400">Counter Key: {counterKey}</p>
            )}
            <button
              onClick={(e) => {
                e.preventDefault();
                handleIncrementCounter();
              }}
              disabled={!publicKey || !counterKey}
              className={`disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#fa6ece] bg-[#fa6ece] 
                rounded-lg w-auto py-1 font-semibold transition-all duration-200 hover:bg-transparent 
                border-2 border-transparent hover:border-[#fa6ece]`}
            >
              Increment Counter
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleDecrementCounter();
              }}
              disabled={!publicKey || !counterKey || count === 0}
              className="disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#fa6ece] bg-[#fa6ece] rounded-lg w-auto py-1 font-semibold transition-all duration-200 hover:bg-transparent border-2 border-transparent hover:border-[#fa6ece]"
            >
              Decrement Counter
            </button>
          </div>
          <div className="text-sm font-semibold mt-8 bg-[#222524] border-2 border-gray-500 rounded-lg p-2">
            <ul className="p-2">
              {outputs.map(({ title, dependency, href }, index) => (
                <li
                  key={title}
                  className={`flex justify-between items-center ${
                    index !== 0 && "mt-4"
                  }`}
                >
                  <p className="tracking-wider">{title}</p>
                  {dependency && (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex text-[#80ebff] italic ${
                        href && "hover:text-white"
                      } transition-all duration-200`}
                    >
                      {dependency.toString().slice(0, 25)}
                      {href && <ExternalLinkIcon className="w-5 ml-1" />}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Starter;
