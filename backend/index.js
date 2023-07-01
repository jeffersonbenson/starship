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

      // console.log(item.status.phase);
      pod["id"] = id;
      pod["status"] = podStatus;
      pod["state"] = item.status.phase;
      pod["name"] = item.metadata.name;
      pod["time"] =
        (
          (new Date(item.metadata.annotations.expireTime).getTime() -
            new Date().getTime()) /
          (1000 * 60 * 60)
        ).toFixed(2) + " hours";
      pod["uid"] = item.metadata.uid;
      pod["image"] = item.spec.containers[0].image;
      pod["address"] = item.status.podIP;
      pod["logs"] = await getLogs(item.metadata.name, req.params.pubkey);
      id++;
      podObject.push(pod);
    }
    // console.log(podObject);
    const runningPods = podObject.filter(
      (podObject) => podObject.state !== "Succeeded"
    );
    res.json(runningPods);
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

  k8sApi.readNamespace(req.body.pubKey).catch((res) => {
    console.log("Namespace not found. Creating namespace...");
    const createNamespace = {
      metadata: {
        name: req.body.pubKey,
      },
    };
    k8sApi.createNamespace(createNamespace);
  });

  var expireTime = new Date();
  expireTime.setHours(expireTime.getHours() + parseInt(req.body.time));

  deploymentName = req.body.name + "-" + req.body.pubKey;

  const deployment = {
    apiVersion: "helm.cattle.io/v1",
    kind: "HelmChart",
    metadata: {
      name: deploymentName.substring(0, 40),
      namespace: "staging",
    },
    spec: {
      chart: "https://%{KUBERNETES_API}%/static/deployment_chart.tgz",
      targetNamespace: req.body.pubKey,
      set: {
        deploymentName: deploymentName.substring(0, 40),
        expireTime: expireTime,
        image: req.body.link,
        networking: req.body.networking,
        sku: req.body.sku,
      },
    },
  };

  k8sHelmClient
    .createNamespacedCustomObject(
      "helm.cattle.io",
      "v1",
      "staging",
      "helmcharts",
      deployment
    )
    .then((response) => {
      // console.log(deployment);
      console.log("Pod deployed!");
    })
    .catch((err) => {
      console.error(err);
    });
});

app.post("/deletePod", (req, res) => {
  res.json(req.body);

  chart = "";

  k8sApi
    .readNamespacedPod(req.body.name, req.body.namespace)
    .then((response) => {
      // console.log(response.body.metadata.labels.name);
      chart = response.body.metadata.labels.name;
    });
  k8sHelmClient.deleteNamespacedCustomObject(
    "helm.cattle.io",
    "v1",
    "staging",
    "helmcharts",
    chart
  );
  console.log("pod deleted!");
});

app.post("/addTime", (req, res) => {
  res.json(req.body)

  k8sApi.listNamespacedPod(`${req.body.namespace}`)
    .then((res) => {
      newTime = new Date(response.body.items[0].metadata.annotations.expireTime + `${req.body.hours}`)
        const patch = [
            {
                "op": "replace",
                "path":"/metadata/annotations",
                "value": {
                    "expireTime": newTime
                }
            }
        ];
        const options = { "headers": { "Content-type": k8s.PatchUtils.PATCH_FORMAT_JSON_PATCH}};
        k8sApi.patchNamespacedPod(res.body.items[0].metadata.name, `${req.body.namespace}`, patch, undefined, undefined, undefined, undefined, undefined, options)
            .then(() => { console.log("Patched.")})
            .catch((err) => { console.log("Error: "); console.log(err)});
    });
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
