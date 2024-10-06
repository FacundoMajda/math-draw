import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";
import sharp from "sharp";
// import { derivative, simplify } from "mathjs";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genai = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function analyzeImage(imageBuffer, dictOfVars) {
  const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });

  const dictOfVarsStr = JSON.stringify(dictOfVars);
  const prompt = `
Se te ha dado una imagen con algunas expresiones matemáticas, ecuaciones o problemas gráficos, y necesitas resolverlos.

**Nota:** Usa la regla PEMDAS para resolver las expresiones matemáticas. 
PEMDAS significa el Orden de Prioridad: Paréntesis, Exponentes, Multiplicación y División (de izquierda a derecha), Suma y Resta (de izquierda a derecha). Los paréntesis tienen la prioridad más alta, seguidos por los exponentes, luego la multiplicación y la división, y finalmente la suma y la resta, no olvides los corchetes.

**PUEDES TENER SEIS TIPOS DE ECUACIONES/EXPRESIONES EN ESTA IMAGEN, Y SOLO UN CASO SE APLICARÁ CADA VEZ:**

1. **Expresiones matemáticas simples**:
   Ejemplos:
   - 2 + 3 * 4 - (5 + 1)
     Respuesta: [{"expr": "2 + 3 * 4 - (5 + 1)", "result": 9}]
   - 8 / 2 + 5^2 - 3 * 4
     Respuesta: [{"expr": "8 / 2 + 5^2 - 3 * 4", "result": 17}]
   - (10 - 2) * 3 + 15 / 3
     Respuesta: [{"expr": "(10 - 2) * 3 + 15 / 3", "result": 29}]

2. **Conjunto de Ecuaciones**:
   Ejemplos:
   - x + y = 10, 2x - y = 4
     Respuesta: [{"expr": "x", "result": 6, "assign": true}, {"expr": "y", "result": 4, "assign": true}]
   - 3x + 2y = 14, x - y = 1
     Respuesta: [{"expr": "x", "result": 4, "assign": true}, {"expr": "y", "result": 3, "assign": true}]
   - x^2 + y^2 = 25, x + y = 7
     Respuesta: [{"expr": "x", "result": 4, "assign": true}, {"expr": "y", "result": 3, "assign": true}]

3. **Asignación de valores a variables**:
   Ejemplos:
   - a = 5, b = 3, c = a + b
     Respuesta: [{"expr": "a", "result": 5, "assign": true}, {"expr": "b", "result": 3, "assign": true}, {"expr": "c", "result": 8, "assign": true}]
   - x = 10, y = x / 2, z = x * y
     Respuesta: [{"expr": "x", "result": 10, "assign": true}, {"expr": "y", "result": 5, "assign": true}, {"expr": "z", "result": 50, "assign": true}]
   - p = 2, q = p^3, r = q - p
     Respuesta: [{"expr": "p", "result": 2, "assign": true}, {"expr": "q", "result": 8, "assign": true}, {"expr": "r", "result": 6, "assign": true}]

4. **Análisis de problemas matemáticos gráficos**:
   Ejemplos:
   - Un triángulo rectángulo con catetos de 3 y 4 unidades.
     Respuesta: [{"expr": "Calcular la hipotenusa de un triángulo rectángulo con catetos de 3 y 4 unidades", "result": 5}]
   - Un cilindro con radio 5 cm y altura 10 cm.
     Respuesta: [{"expr": "Calcular el volumen de un cilindro con radio 5 cm y altura 10 cm", "result": "785.4 cm³"}]
   - Una esfera inscrita en un cubo de lado 8 cm.
     Respuesta: [{"expr": "Calcular el radio de una esfera inscrita en un cubo de lado 8 cm", "result": "4 cm"}]

5. **Detección de Conceptos Abstractos**:
   Ejemplos:
   - Una imagen de dos manos estrechándose.
     Respuesta: [{"expr": "Dos manos estrechándose", "result": "Cooperación"}]
   - Una balanza equilibrada con un mazo de juez en un platillo y un libro en el otro.
     Respuesta: [{"expr": "Balanza equilibrada con mazo de juez y libro", "result": "Justicia"}]
   - Un foco encendido sobre una cabeza humana.
     Respuesta: [{"expr": "Foco encendido sobre una cabeza humana", "result": "Idea o inspiración"}]

6. **Derivadas y otros problemas de cálculo**:
   Ejemplos de derivadas más complejas:

  a) Funciones polinómicas y racionales:
   - d/dx(27x - π)
     Respuesta: [{"expr": "d/dx(27x - π)", "result": "27"}]
   - d/dx(5x^2/4)
     Respuesta: [{"expr": "d/dx(5x^2/4)", "result": "5x/2"}]
   - d/dx(7/x)
     Respuesta: [{"expr": "d/dx(7/x)", "result": "-7/x^2"}]
   - d/dx(5/(2x)^3)
     Respuesta: [{"expr": "d/dx(5/(2x)^3)", "result": "-15/(8x^4)"}]
   - d/dx(x^3/5 + 2/x^4)
     Respuesta: [{"expr": "d/dx(x^3/5 + 2/x^4)", "result": "3x^2/5 - 8/x^5"}]
   - d/dx((2x^2 - 3x + 1)/x)
     Respuesta: [{"expr": "d/dx((2x^2 - 3x + 1)/x)", "result": "(2x^2 - 1)/x^2"}]

  b) Funciones con raíces y exponenciales:
   - d/dx(√(2x))
     Respuesta: [{"expr": "d/dx(√(2x))", "result": "1/√x"}]
   - d/dx(x·2^x)
     Respuesta: [{"expr": "d/dx(x·2^x)", "result": "2^x(1 + x·ln2)"}]
   - d/dx(xe^x)
     Respuesta: [{"expr": "d/dx(xe^x)", "result": "e^x(1 + x)"}]
   - d/dx(√(3x))
     Respuesta: [{"expr": "d/dx(√(3x))", "result": "1/(2√(3x))"}]
   - d/dx(∛x + ∜x)
     Respuesta: [{"expr": "d/dx(∛x + ∜x)", "result": "1/(3x^(2/3)) + 1/(4x^(3/4))"}]

  c) Funciones trigonométricas y sus inversas:
   - d/dx(tg^2·x^2)
     Respuesta: [{"expr": "d/dx(tg^2·x^2)", "result": "4x·tg x^2·sec^2 x^2"}]
   - d/dx(arccos√x)
     Respuesta: [{"expr": "d/dx(arccos√x)", "result": "-1/(2√(x-x^2))"}]
   - d/dx(arctg e^x)
     Respuesta: [{"expr": "d/dx(arctg e^x)", "result": "e^x/(1+e^2x)"}]

  d) Funciones compuestas y producto:
   - d/dx((x^2+1)(2x^3-5))
     Respuesta: [{"expr": "d/dx((x^2+1)(2x^3-5))", "result": "10x^4 + 6x^2 - 10x"}]
   - d/dx(sen(x^3 + 3x - 1))
     Respuesta: [{"expr": "d/dx(sen(x^3 + 3x - 1))", "result": "(3x^2 + 3)cos(x^3 + 3x - 1)"}]
   - d/dx(cos(x^4 - x))
     Respuesta: [{"expr": "d/dx(cos(x^4 - x))", "result": "-(4x^3 - 1)sen(x^4 - x)"}]

  e) Funciones con fracciones complejas:
   - d/dx(1/(x√x))
     Respuesta: [{"expr": "d/dx(1/(x√x))", "result": "-3/(2x^2√x)"}]
   - d/dx((x^3 + 3x^2 - 5x + 3)/x)
     Respuesta: [{"expr": "d/dx((x^3 + 3x^2 - 5x + 3)/x)", "result": "(2x^2 + 3x - 3)/x^2"}]
   - d/dx(√(x^2 + 1)/(√x^2 - 1))
     Respuesta: [{"expr": "d/dx(√(x^2 + 1)/(√x^2 - 1))", "result": "-2x/((x^2+1)(x^2-1)^(3/2))"}]

  f) Funciones exponenciales y logarítmicas:
   - d/dx(ln^3(x))
     Respuesta: [{"expr": "d/dx(ln^3(x))", "result": "3ln^2(x)/x"}]
   - d/dx(π/(5x)^2)
     Respuesta: [{"expr": "d/dx(π/(5x)^2)", "result": "-2π/(25x^3)"}]

  g) Funciones compuestas:
   - d/dx((1 + 3x^4)^5)
     Respuesta: [{"expr": "d/dx((1 + 3x^4)^5)", "result": "60x^3(1 + 3x^4)^4"}]
   - d/dx(√(1 - x^2))
     Respuesta: [{"expr": "d/dx(√(1 - x^2))", "result": "-x/√(1 - x^2)"}]

  h) Funciones trigonométricas:
   - d/dx(sen(x^2))
     Respuesta: [{"expr": "d/dx(sen(x^2))", "result": "2x cos(x^2)"}]
   - d/dx(arctg(x))
     Respuesta: [{"expr": "d/dx(arctg(x))", "result": "1/(1 + x^2)"}]

Recuerda aplicar las reglas de derivación correctamente, incluyendo la regla de la cadena, del producto y del cociente cuando sea necesario. Simplifica las expresiones finales cuando sea posible.

Analiza la ecuación o expresión en esta imagen y devuelve la respuesta de acuerdo a las reglas dadas:
Asegúrate de usar barras invertidas extras para caracteres de escape como \\f -> \\\\f, \\n -> \\\\n, etc.
Aquí tienes un diccionario de variables asignadas por el usuario. Si la expresión dada tiene alguna de estas variables, usa su valor real de este diccionario en consecuencia: ${dictOfVarsStr}.
NO USES ACENTOS GRAVES O FORMATO DE MARKDOWN.
CITA CORRECTAMENTE LAS CLAVES Y VALORES EN EL DICCIONARIO PARA UNA PARSING MÁS FÁCIL CON JSON.parse de JavaScript.
`;

  try {
    // Convert image to PNG format (Gemini API requirement)
    const pngBuffer = await sharp(imageBuffer).png().toBuffer();

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: pngBuffer.toString("base64"),
          mimeType: "image/png",
        },
      },
    ]);
    const response = result.response;
    console.log(response);

    let answers = [];
    try {
      answers = JSON.parse(response.text());
    } catch (e) {
      console.error(`Error in parsing response from Gemini API: ${e}`);
    }

    console.log("Respuesta: ", answers);

    return answers.map((answer) => ({
      ...answer,
      assign: answer.assign || false,
    }));
  } catch (error) {
    console.error("Error: ", error);
    throw error;
  }
}
// answers = answers.map((answer) => {
//       console.log("🔍 Processing answer: ", answer);

//       if (answer.expr.includes("'")) {
//         // Assuming derivative expressions are marked with '
//         const expr = answer.expr.replace("'", ""); // Remove ' mark
//         console.log("🔍 Found derivative expression: ", expr);

//         // Check if the expression is a known function
//         if (dictOfVars[expr]) {
//           console.log("🔍 Found function in dictionary: ", dictOfVars[expr]);
//           const result = derivative(dictOfVars[expr], "x").toString(); // Calculate derivative
//           console.log("🔍 Calculated derivative: ", result);

//           const simplifiedResult = simplify(result).toString(); // Simplify result
//           console.log("🔍 Simplified derivative: ", simplifiedResult);

//           return {
//             expr: `Derivative of ${expr} with respect to x`,
//             result: simplifiedResult,
//             assign: answer.assign || false,
//           };
//         } else {
//           console.error(`❌ Unknown function: ${expr}`);
//           console.log("🔍 Contents of dictionary: ", dictOfVars);
//           throw new Error(`Unknown function: ${expr}`);
//         }
//       } else {
//         return {
//           ...answer,
//           assign: answer.assign || false,
//         };
//       }
//     });

//     console.log("🔍 Final answers: ", answers);

//     return answers;
//   } catch (error) {
//     console.error("Error: ", error);
//     throw error;
//   }
// }
