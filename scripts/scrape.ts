const puppeteer = require("puppeteer");
const vision = require("@google-cloud/vision");
const path = require("path");
const fs = require("fs");

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://ningi.co.uk", { waitUntil: "networkidle0" });

  const client = new vision.ImageAnnotatorClient({
    keyFilename: "./testing-gcv-408610-b27e0fe85413.json",
  });
  const screenshot = await page.screenshot({
    // path: "test.png",
    fullPage: true,
  });

  // console.log(screenshot);// buffer
  fs.writeFileSync(path.resolve(__dirname, "output.png"), screenshot);

  /*
  THIS IS TO USE A LOCAL FILE
  const Tom2 = fs.readFileSync(path.resolve(__dirname, "tom2.png"));
  const screenshot = Tom2;
*/

  // 1 Detect logos in the webpage screenshot
  const [logoResult] = await client.logoDetection({
    image: { content: screenshot },
  });
  const logos = logoResult.logoAnnotations;
  console.log("logoResult :", logoResult);
  console.log("Logos:");
  logos.forEach((logo: any) => console.log("logo", logo.description));
  console.log("\n\n   ");
  // 2 Detect text in the webpage screenshot
  const [textResult] = await client.textDetection({
    image: { content: screenshot },
  });
  const detections = textResult.textAnnotations;
  let fullText: any[] = [];
  detections.forEach((text: any) => fullText.push(text.description));
  console.log(" text ");
  console.log(fullText.join(" "));

  console.log("\n\n   ");

  // 3 Identify landmarks in the webpage screenshot
  const [landmarkResult] = await client.landmarkDetection({
    image: { content: screenshot },
  });
  const landmarks = landmarkResult.landmarkAnnotations;
  landmarks.forEach((landmark: any) =>
    console.log(`Landmark Description: ${landmark.description}`)
  );

  console.log("\n\n   ");

  // 4 Detect faces in the webpage screenshot
  const [faceResult] = await client.faceDetection({
    image: { content: screenshot },
  });
  const faces = faceResult.faceAnnotations;
  faces.forEach((face: any, index: any) => {
    console.log(`Face ${index + 1}:`);
    console.log(`Joy Likelihood: ${face.joyLikelihood}`);
    console.log(`Sorrow Likelihood: ${face.sorrowLikelihood}`);
  });
  console.log("\n\n   ");

  // 5 Detect properties in the webpage screenshot
  const [imagePropsResult] = await client.imageProperties({
    image: { content: screenshot },
  });
  const colors =
    imagePropsResult.imagePropertiesAnnotation.dominantColors.colors;
  colors.forEach((color: any) => {
    console.log(
      `Color RGB: ${color.color.red}, ${color.color.green}, ${color.color.blue}`
    );
    console.log(`Score: ${color.score}`);
    console.log(`Pixel Fraction: ${color.pixelFraction}`);
  });
  console.log("\n\n   ");

  // 6 Localize objects in the webpage screenshot
  const [objectsResult] = await client.objectLocalization({
    image: { content: screenshot },
  });
  const objects = objectsResult.localizedObjectAnnotations;
  objects.forEach((object: any) => {
    console.log(`Object Description: ${object.name}`);
    console.log(
      `Bounding Poly Coordinates:`,
      object.boundingPoly.normalizedVertices
    );
  });
  console.log("\n\n   ");

  // 7 Assess if the image content is appropriate
  const [safeResult] = await client.safeSearchDetection({
    image: { content: screenshot },
  });
  const safe = safeResult.safeSearchAnnotation;
  console.log(`Adult Content: ${safe.adult}`);
  console.log(`Spoof Content: ${safe.spoof}`);
  console.log(`Medical Content: ${safe.medical}`);
  console.log(`Violence Content: ${safe.violence}`);
  console.log(`Racy Content: ${safe.racy}`);
  console.log("\n\n   ");

  // 8 Get crop hints for the webpage screenshot
  const [cropHintsResult] = await client.cropHints({
    image: { content: screenshot },
  });
  const cropHints = cropHintsResult.cropHintsAnnotation.cropHints;
  cropHints.forEach((hint: any) => {
    console.log(`Crop Hint Bounds:`, hint.boundingPoly.vertices);
  });
  console.log("\n\n   ");

  // 9 Find similar images on the web
  const [webResult] = await client.webDetection({
    image: { content: screenshot },
  });
  const webEntities = webResult.webDetection.webEntities;
  console.log("Web Entities:");
  webEntities.forEach((webEntity: any) => {
    console.log(
      `Description: ${webEntity.description}, Score: ${webEntity.score}`
    );
  });

  const fullMatchingImages = webResult.webDetection.fullMatchingImages;
  console.log("Full Matching Images:");
  fullMatchingImages.forEach((image: any) => {
    console.log(image.url);
  });

  const pagesWithMatchingImages =
    webResult.webDetection.pagesWithMatchingImages;
  console.log("Pages with Matching Images:");
  pagesWithMatchingImages.forEach((page: any) => {
    console.log(page.url);
  });
  console.log("\n\n   ");

  // 10 Detect products in the webpage screenshot
  const [productResult] = await client.productSearch({
    image: { content: screenshot },
  });
  const products = productResult.productSearchResults?.results || [];
  [...products].forEach((product: any) => {
    console.log(`Product Name: ${product.product.name}`);
    console.log(`Product Category: ${product.product.productCategory}`);
  });

  console.log("*** finished ***");

  await browser.close();
})();
