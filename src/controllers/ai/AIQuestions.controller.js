export const getAIQuestions = async (req, res) => {
  try {
    res.json({
      questions: [
        {
          id: 'q1',
          question: '¿Cada cuánto comprás repuestos?',
          type: 'single',
          options: ['Semanal', 'Mensual', 'Ocasional']
        }
      ]
    })
  } catch (error) {
    console.error('[AIQuestions]', error)
    res.status(500).json({ msg: 'Error obteniendo preguntas IA' })
  }
}