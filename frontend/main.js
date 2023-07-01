import "@picocss/pico";
import "./assets/line-awesome.min.css";

import * as web3 from "@solana/web3.js";
import { Buffer } from "buffer";
window.global = window;
global.Buffer = global.Buffer || Buffer;

window.makePayment = async (pubkey, hours) => {
  const connection = new web3.Connection(
    web3.clusterApiUrl(import.meta.env.CLUSTER_API_URL),
    { confirmTransactionInitialTimeout: 5000 }
  );

  console.log("connection established!");

  let transferAmount = hours * 1 * web3.LAMPORTS_PER_SOL;

  const escrow_wallet = new web3.PublicKey(import.meta.env.VITE_ESCROW_WALLET);

  let ix = new web3.Transaction().add(
    web3.SystemProgram.transfer({
      fromPubkey: window.solana.publicKey,
      toPubkey: escrow_wallet,
      lamports: transferAmount,
    })
  );
  // Setting the variables for the transaction
  ix.feePayer = await window.solana.publicKey;
  let blockhashObj = await connection.getLatestBlockhash();
  ix.recentBlockhash = await blockhashObj.blockhash;

  console.log("sending transaction...");
  let signed = await window.solana.signTransaction(ix);
  let signature = await connection.sendRawTransaction(signed.serialize());
  // const confirmation = await connection.confirmTransaction(blockhashObj.blockhash,blockhashObj.lastValidBlockHeight,signature);
  const confirmation = await connection.confirmTransaction(signature);
  console.log("Signature: ", signature);
  alert("Payment successful!");
};

window.stopPod = async (name, lowerpubKey) => {
  if (confirm("Data loss may occur. Confirm?")) {
    console.log("stopping pod" + name);
    fetch("http://localhost:8080/deletePod", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: name, namespace: lowerpubKey }),
    }).then((response) => {
      alert("Pod Deleted! Reload the app to see the changes");
    });
  }
};

window.addTime = async (name, lowerpubKey) => {
  console.log("adding time");
  hours = prompt("Hours to add:");
  if (hours == null || hours == "") {
    alert("Add cancelled!");
  } else {
    window.makePayment(pubkey, hours)
    fetch("http://localhost:8080/addTime", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        body: JSON.stringify({
          name: name,
          namespace: lowerpubKey,
          hours: hours,
        }),
      },
    }).then((response) => {
      alert("Time added! Reload the app to see the changes");
    });
  }
};

import Alpine from "alpinejs";

window.Alpine = Alpine;

Alpine.start();
