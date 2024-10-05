import express from "express";
import cors from "cors";
import morgan from "morgan";
import { analyzeImage } from "./core.js";

const app = express();
const port = 3000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Hola Mundo");
});

app.post("/calculate", async (req, res) => {
  try {
    const { image, dict_of_vars } = req.body;

    // Decodificar imagen base64
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const imageBuffer = Buffer.from(base64Data, "base64");

    const responses = await analyzeImage(imageBuffer, dict_of_vars);

    const data = responses.map((response) => ({
      ...response,
      assign: response.assign || false,
    }));

    console.log("Respuesta en ruta: ", responses);

    res.json({
      status: "success",
      message: "Imagen procesada",
      data: data,
    });
  } catch (error) {
    console.error("Error procesando imagen:", error);
    res.status(500).json({
      status: "error",
      message: "Error procesando imagen",
      error: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor en el puerto ${port}`);
});
