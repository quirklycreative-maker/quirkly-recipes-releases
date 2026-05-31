const glycemicLoad = 10.3;
const exactGI = 55;
const giLevel = 'low';

console.log("GL: ", glycemicLoad);
console.log("exactGI: ", exactGI);
console.log("giLevel: ", giLevel);

let circleColor = glycemicLoad <= 10.9 ? 'giLow' : glycemicLoad <= 19.9 ? 'giMedium' : 'giHigh';
console.log("Circle Color based on GL: ", circleColor);

const modalHeroText = glycemicLoad !== undefined 
  ? `LOW/MEDIUM/HIGH: ${glycemicLoad <= 10.9 ? 'LOW' : glycemicLoad <= 19.9 ? 'MEDIUM' : 'HIGH'}` 
  : `GI Level: ${giLevel.toUpperCase()}`;
console.log("Hero text: ", modalHeroText);

