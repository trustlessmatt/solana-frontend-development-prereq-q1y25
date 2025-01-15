import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useConnection } from "@solana/wallet-adapter-react";
import BoilerPlate from "../../components/BoilerPlate";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

const Starter = () => {
  const [balance, setBalance] = useState<number | null>(0);
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  useEffect(() => {
    // when the status of connection changes, we want to update the balance
    const recheckBalance = async () => {
      if (connection && publicKey) {
        const info = await connection.getAccountInfo(publicKey);
        setBalance(info!.lamports / LAMPORTS_PER_SOL);
      }
    };

    recheckBalance();
  }, [connection, publicKey]);

  return (
    <main className="min-h-screen text-white">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4">
        <div className="col-span-1 lg:col-start-2 lg:col-end-4 rounded-lg bg-[#2a302f] h-60 p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-semibold">account info 👀</h2>
          </div>

          <div className="mt-8 bg-[#222524] border-2 border-gray-500 rounded-lg p-2">
            <ul className="p-2">
              <li className="flex justify-between">
                <p className="tracking-wider">Wallet is connected...</p>
                <p
                  className={`${
                    publicKey ? "text-turbine-green" : "text-red-500"
                  } italic font-semibold`}
                >
                  {publicKey ? "yes" : "no"}
                </p>
              </li>

              <li className="text-sm mt-4 flex justify-between">
                <p className="tracking-wider">Balance...</p>
                <p className="text-turbine-green italic font-semibold">
                  {balance}
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Starter;
