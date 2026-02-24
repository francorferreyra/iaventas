export const processAIAnswers = async (req, res) => {
  try {
    const { clientId, answers } = req.body

    // mock por ahora
    res.json({
      ok: true,
      clientId,
      result: {
        segment: 'cliente_frecuente',
        action: 'Ofrecer descuento por volumen'
      }
    })
  } catch (error) {
    console.error('[AIAnswers]', error)
    res.status(500).json({ msg: 'Error procesando respuestas IA' })
  }
}