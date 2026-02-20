import "dotenv/config"

// ==========================
// IMPORTS DE SCRIPTS
// ==========================
import { exec } from "child_process"
import { promisify } from "util"
import mongoose from "mongoose"
import { connectMongo, getMarketingConnection } from "../db/mongo.connections.js"

const execAsync = promisify(exec)

// ==========================
// UTILS
// ==========================
function logStep(title) {
  console.log("\n" + "═".repeat(60))
  console.log(`🚀 ${title}`)
  console.log("═".repeat(60))
}

async function runCommand(label, command) {
  console.log(`\n▶ ${label}`)
  const start = Date.now()

  try {
    const { stdout, stderr } = await execAsync(command)

    if (stdout) console.log(stdout)
    if (stderr) console.error(stderr)

    const duration = ((Date.now() - start) / 1000).toFixed(2)
    console.log(`✅ ${label} finalizado (${duration}s)`)

    return { success: true, duration }
  } catch (error) {
    console.error(`❌ Error en ${label}`)
    console.error(error.message)
    return { success: false, error: error.message }
  }
}

// ==========================
// MAIN PIPELINE
// ==========================
async function runMonthlyPipeline() {
  console.time("⏱ Duración total pipeline")

  const pipelineLog = {
    startedAt: new Date(),
    steps: [],
    status: "RUNNING"
  }

  try {
    // ==========================
    // 1️⃣ IMPORTAR CSV
    // ==========================
    logStep("IMPORTANDO VENTAS (CSV)")
    pipelineLog.steps.push(
      await runCommand(
        "Importación de ventas",
        "node src/scripts/importAllCSV.js"
      )
    )

    // ==========================
    // 2️⃣ GENERAR MÉTRICAS
    // ==========================
    logStep("GENERANDO MÉTRICAS DE CLIENTES")
    pipelineLog.steps.push(
      await runCommand(
        "Generación clients_metrics",
        "node src/scripts/metrics/generateClientsMetrics.js"
      )
    )

    // ==========================
    // 3️⃣ LIMPIAR INSIGHTS IA
    // ==========================
    logStep("LIMPIANDO INSIGHTS IA")
    await connectMongo()
    const db = getMarketingConnection()
    const insights = db.collection("clients_ai_insights")

    const deleteResult = await insights.deleteMany({})
    console.log(`🧹 Insights eliminados: ${deleteResult.deletedCount}`)

    pipelineLog.steps.push({
      step: "clean_insights",
      deleted: deleteResult.deletedCount
    })

    // ==========================
    // 4️⃣ GENERAR INSIGHTS IA
    // ==========================
    logStep("GENERANDO INSIGHTS IA")
    pipelineLog.steps.push(
      await runCommand(
        "Generación insights OpenAI",
        "node src/scripts/generateClientInsightsOpenAI.js"
      )
    )

    // ==========================
    // 5️⃣ PINECONE (OPCIONAL)
    // ==========================
    if (process.env.RUN_PINECONE === "true") {
      logStep("SINCRONIZANDO PINECONE")
      pipelineLog.steps.push(
        await runCommand(
          "Sync Pinecone",
          "node src/scripts/fullSyncClientsToPinecone.js"
        )
      )
    } else {
      console.log("⚠ Pinecone desactivado (RUN_PINECONE=false)")
    }

    pipelineLog.status = "SUCCESS"
    pipelineLog.finishedAt = new Date()

  } catch (error) {
    pipelineLog.status = "ERROR"
    pipelineLog.error = error.message
    pipelineLog.finishedAt = new Date()
    console.error("🔥 Error crítico en pipeline:", error)
  } finally {
    // ==========================
    // GUARDAR LOG
    // ==========================
    try {
      const db = getMarketingConnection()
      await db.collection("pipeline_runs").insertOne(pipelineLog)
      console.log("📝 Log de pipeline guardado")
    } catch (e) {
      console.error("❌ Error guardando log pipeline", e.message)
    }

    console.timeEnd("⏱ Duración total pipeline")
    process.exit(0)
  }
}

// ==========================
runMonthlyPipeline()
