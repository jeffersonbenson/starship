const express = require('express');
const k8s = require('@kubernetes/client-node');

const app = express();
const PORT = 8080;

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

app.get(
  '/getpods/:pubkey',
  (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    k8sApi.listNamespacedPod(`${req.params.pubkey}`)
    .then((response) => {
      podObject = [];
      id = 1;
      //console.log(response.body.items)
        for (const item of response.body.items) {
          pod = {};
          pod["id"] = id;
          pod["name"] = item.metadata.name;
          pod["image"] = item.spec.containers[0].image;
          id++
          podObject.push(pod)
      }
      podSender = {pods: podObject}
      res.json(podSender);
    });
  }
);

app.post(
  'deploy',
  (req, res) => {
    res.send('Deploying pods...')
    const yamlString = k8s.dumpYaml({
      metadata: {
        name: `${req.params.pubkey}`,
        time: `${req.params.time}`
      },
      spec: {
        valuesContent: {
          image: `${req.params.image}`
        }
      }
    });
  }
);

app.get(
  'nodes',
  (req, res) => {

  }
);

app.listen(
  PORT,
  () => console.log(`Server running on http://localhost:${PORT}`)
)
