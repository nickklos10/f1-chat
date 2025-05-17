import {DataAPIClient} from "@datastax/astra-db-ts"
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import {OpenAI} from "openai"
import {RecursiveCharacterTextSplitter} from "langchain/text_splitter"

import "dotenv/config"

type SimilarityMetric = "dot_product" | "cosine" | "euclidean"

const {ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OPENAI_API_KEY } = process.env

const openai = new OpenAI({apiKey: OPENAI_API_KEY});

const f1Data = [
    'https://en.wikipedia.org/wiki/Formula_One',
    'https://www.formula1.com/en/latest',
    'https://www.skysports.com/f1',
    'https://www.bbc.com/sport/formula1',
    'https://www.espn.com/f1/',
    'https://www.planetf1.com/',
    'https://www.motorsport.com/formula1/',
    'https://www.autosport.com/f1/',
    'https://www.racefans.net/',
    'https://racer.com/formula-1-schedule/',
    'https://www.crash.net/motorsport/formula-1',
    'https://racingnews365.com/formula-1-calendar-2025',
    'https://racingnews365.com/formula-1-standings-2025',
    'https://racingnews365.com/',
    'https://www.autosport.com/f1/driver-ratings/',
    'https://www.autosport.com/f1/schedule/2025/',
    'https://www.autosport.com/f1/standings/2025/',
    'https://www.newsnow.com/us/Sports/F1'
]

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN)
const db = client.db(ASTRA_DB_API_ENDPOINT, {keyspace: ASTRA_DB_NAMESPACE})

const splitter = new RecursiveCharacterTextSplitter({chunkSize: 512, chunkOverlap: 100})

const createCollection = async (similarityMetric: SimilarityMetric = "dot_product") => {
    const res = await db.createCollection(ASTRA_DB_COLLECTION, {
        vector: {
            dimension: 1536,
            metric: similarityMetric,
        }
    })
    console.log(res)
}

const loadSampleData = async () => {
    const collection = db.collection(ASTRA_DB_COLLECTION)
    for await (const url of f1Data) {
        const content = await scrapePage(url)
        const chunks = await splitter.splitText(content)
        for await (const chunk of chunks) {
            const embedding = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: chunk,
                encoding_format: "float",
            })

            const vector = embedding.data[0].embedding
            const res = await collection.insertOne({
                $vector: vector,
                text: chunk,
            })
            console.log(res)
        }
    }
}


const scrapePage = async (url: string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: true
        },
        gotoOptions: {
            waitUntil: "domcontentloaded"
        },
        evaluate: async (page, browser) => {
            const result = await page.evaluate(() => document.body.innerHTML)
            await browser.close()
            return result
        }
    })
    return ( await loader.scrape() )?.replace(/<[^>]+>/g, '')
}

createCollection().then(() => loadSampleData())
