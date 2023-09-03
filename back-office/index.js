const web3 = require("@solana/web3.js");
const k8s = require("@kubernetes/client-node");

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const rate = process.env.RATE;

const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const connection = new web3.Connection(
  web3.clusterApiUrl("devnet"),
  "confirmed"
);

//console.log(connection);

const main = async () => {
  try {
    const topNodesRes = await k8s.topNodes(k8sApi);
    //console.log(topNodesRes);
    for (let i = 0; i < topNodesRes.length; i++) {
      let logObj = new Object();

      let operator = topNodesRes[i].Node.metadata.annotations.operatorid;
      logObj.operator = operator;

      let usage = topNodesRes[i].CPU.RequestTotal;
      logObj.usage = usage;

      let paycheck = usage * rate;
      logObj.paycheck = paycheck;

      var transaction = new web3.Transaction().add(
        web3.SystemProgram.transfer({
          fromPubkey: fromWallet.publicKey,
          toPubkey: operator,
          lamports: paycheck,
        })
      );

      console.log(logObj);
    }
  } catch (err) {
    console.error(err);
  }
};

main();
