'use strict'

const config = require('../config')
const key = config.TA_KEY;
const endpoint = config.TA_ENDPOINT;


const {
    AzureKeyCredential,
    TextAnalysisClient,
  } = require("@azure/ai-language-text");

  const client = new TextAnalysisClient(endpoint, new AzureKeyCredential(key));


async function callTextAnalytics (req, res){
    var jsonText = req.body;
    const documents = [
        jsonText.text
      ];
    const actions = [
        {
          kind: "Healthcare",
        },
      ];

  const poller = await client.beginAnalyzeBatch(actions, documents, "en");
  const results = await poller.pollUntilDone();
  for await (const actionResult of results) {
    if (actionResult.kind !== "Healthcare") {
      //throw new Error(`Expected a healthcare results but got: ${actionResult.kind}`);
      res.status(500).send(`Expected a healthcare results but got: ${actionResult.kind}`)
    }
    if (actionResult.error) {
      const { code, message } = actionResult.error;
      //throw new Error(`Unexpected error (${code}): ${message}`);
      res.status(500).send(`Unexpected error (${code}): ${message}`)
    }
    for (const result of actionResult.results) {
      console.log(`- Document ${result.id}`);
      if (result.error) {
        const { code, message } = result.error;
        //throw new Error(`Unexpected error (${code}): ${message}`);
        res.status(500).send(`Unexpected error (${code}): ${message}`)
      }
      console.log("\tRecognized Entities:");
      res.status(200).send(result)
      /*for (const entity of result.entities) {
        console.log(`\t- Entity "${entity.text}" of type ${entity.category}`);
        if (entity.dataSources.length > 0) {
          console.log("\t and it can be referenced in the following data sources:");
          for (const ds of entity.dataSources) {
            console.log(`\t\t- ${ds.name} with Entity ID: ${ds.entityId}`);
          }
        }
      }*/
    }
  }
}


module.exports = {
	callTextAnalytics
}
