#!/bin/bash
echo "Welcome to the Back Office"
lamports=".33"
for node in $(kubectl get nodes -o name | cut -c 6-); do
    millicores=$(kubectl top node $node --no-headers=true | awk -F ' ' '{print $2}' | rev | cut -c 2- | rev)
    printf '{"node":"%s","Pubkey":"%s","Work":"%s","Paycheck":"%s","Transaction":"%s"}\n' \
    #Name of the Node
    "$node" \
    #Node operator's public key
    "$(kubectl get node $node -o="jsonpath={.metadata.labels.operatorid}")" \
    #Amount of work measured in millicores
    "$millicores" \
    #Calculation of the paycheck
    "$(echo "$millicores*$lamports" | bc)" \
    #Sending the paycheck to the operator. Returns Transaction ID
    "$(solana transfer --from /home/wallet.json $pubkey $paycheck --allow-unfunded-recipient --url https://api.devnet.solana.com --fee-payer wallet.json)"
done
