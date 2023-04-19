const express = require("express");
const cors = require("cors");
const k8s = require("@kubernetes/client-node");
//const { resolve } = require('path');
const { response } = require("express");

const app = express();
app.use(express.json());
app.use(cors());
const PORT = 8080;

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

const k8sHelmClient = kc.makeApiClient(k8s.CustomObjectsApi);

app.get("/pods/:pubkey", async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  k8sApi.listNamespacedPod(`${req.params.pubkey}`).then(async (response) => {
    podObject = [];
    id = 1;
    for (const item of response.body.items) {
      pod = {};
      podStatus = "";
      if (item.status.containerStatuses[0].started) {
        podStatus = "has-text-primary-dark";
      } else {
        podStatus = "has-text-danger-dark";
      }
      // console.log(item);
      pod["id"] = id;
      pod["status"] = podStatus;
      pod["name"] = item.metadata.name;
      pod["uid"] = item.metadata.uid;
      pod["image"] = item.spec.containers[0].image;
      pod["address"] = item.status.podIP;
      pod["logs"] = await getLogs(item.metadata.name, req.params.pubkey);
      id++;
      podObject.push(pod);
    }
    res.json(podObject);
  });
});

async function getLogs(podName, namespace) {
  // Written 12/16/2022 by ChatGPT, which was able to parse out a poorly documented library into something understandable with accompanying explaination
  try {
    // pod, namespace, container, follow, insecureSkipTLSVerifyBackend, limitBytes, pretty, previous, sinceSeconds, tailLines, timestamps
    const logs = await k8sApi.readNamespacedPodLog(
      podName,
      namespace,
      undefined,
      false,
      undefined,
      undefined,
      false,
      false,
      300,
      30,
      true
    );

    return logs.body;
  } catch (error) {
    console.error(error);
  }
}

app.post("/deploy", (req, res) => {
  // console.log(req.body);
  res.json(req.body);

  const deployment = {
    apiVersion: "helm.cattle.io/v1",
    kind: "HelmChart",
    metadata: {
      name: req.body.name + "-" + req.body.pubKey,
      // namespace: req.body.pubKey,
      namespace: "default",
      sku: req.body.sku,
    },
    spec: {
      repo: "https://charts.bitnami.com/bitnami",
      chart: "apache",
      // chart: ((req.body.sku === 'arm') ? 'arm' : 'x86'),
      // targetNamespace: 'default',
      targetNamespace: req.body.pubKey,
      set: {
        image: req.body.link,
        networking: req.body.networking,
        arch: req.body.sku,
      },
    },
  };

  k8sHelmClient
    .createNamespacedCustomObject(
      "helm.cattle.io",
      "v1",
      "default",
      "helmcharts",
      deployment
    )
    .then((response) => {
      console.log(response.body);
    })
    .catch((err) => {
      console.error(err);
    });
  // console.log(deployment);
});

app.post("/deletePod", (req, res) => {
  res.json(req.body);
  // console.log(req.body);
  k8sApi.deleteNamespacedPod(req.body.name, req.body.namespace);
  // console.log('pod deleted!');
});

app.get("/nodes/:pubkey", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  k8sApi
    .listNode(
      undefined,
      undefined,
      undefined,
      undefined,
      `operatorid=${req.params.pubkey}`
    )
    .then((response) => {
      nodeobject = [];
      id = 1;
      for (const item of response.body.items) {
        //console.log(item);
        node = {};
        node["id"] = id;
        node["name"] = item.metadata.name;
        node["uid"] = item.metadata.uid;
        node["time"] =
          ((new Date() - item.metadata.creationTimestamp) / 3600000).toFixed(
            2
          ) + " hours";
        id++;
        nodeobject.push(node);
      }
      res.json(nodeobject);
    });
});

app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);
