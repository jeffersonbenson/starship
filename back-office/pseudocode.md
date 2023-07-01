# Pseudo-Code for Back Office

Run every 24 hours as a k8s chronjob

1. Loop through nodes
2. Get CPU usage of node
3. Take value and multiply by a given number of lamports
4. Send those lamports to the name of the node, which is the pubkey