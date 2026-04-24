import { initializeRAGSystem, retrieveRelevantGuidelines } from './src/ai/rag-system.js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    console.log("Initialize RAG System (Vertex mode)...");
    initializeRAGSystem();
    const mockVitals = { cardiovascularRisk: 8, mobilityRisk: 3, engagementRisk: 8, combinedRiskScore: 8, socialRisk: 4 };
    console.log("\nQuerying Vertex AI Search for risk profile:", JSON.stringify(mockVitals));
    try {
        const results = await retrieveRelevantGuidelines(mockVitals);
        console.log("\n✅ Vertex Search Success!");
        console.log("Total Guidelines Retrieved:", results.length);
        if (results.length > 0) {
            console.log("\nTop Guideline Source:", results[0].source);
            console.log("Triggers:", results[0].triggers);
            console.log("Evidence snippet from Vertex:", results[0].evidence);
        }
    } catch (err) {
        console.error("❌ Test Failed:", err);
    }
}
test();
