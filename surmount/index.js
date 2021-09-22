/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

/**
 * Addition RNN example.
 *
 * Based on Python Keras example:
 *   https://github.com/keras-team/keras/blob/master/examples/addition_rnn.py
 */


 
 async function generateData(invert, stock) {
  var tick = stock;
  console.log(tick);
  var time = +new Date;
  time = Math.floor(time/1000);
  var starttime = Math.floor(time-10*365*24*60*60);
  url = "https://gentle-flower-8de4.lambdacors.workers.dev?https://query1.finance.yahoo.com/v7/finance/chart/"+tick+"?symbol="+tick+"&interval=1d&period1="+0+"&period2="+time;
  console.log(url);
  //url = "https://cors-anywhere.herokuapp.com/query1.finance.yahoo.com/v7/finance/chart/"+tick+"?symbol="+tick+"&interval=1d&period0="+starttime+"&period2="+time;
  let response = await fetch(url);
  var json;
  if (response.ok) { // if HTTP-status is 200-299
    // get the response body (the method explained below)
    json = await response.json();
  } else {
    console.log("ERROR");
    document.getElementById('stock').value="INVALID TICKER";
    return;
  }
  var open = json.chart.result[0].indicators.quote[0].open;
  console.log(open.length);
  var close = json.chart.result[0].indicators.quote[0].close;
  var high = json.chart.result[0].indicators.quote[0].high;
  var low = json.chart.result[0].indicators.quote[0].low;
  var volume = json.chart.result[0].indicators.quote[0].volume;
  z = [];
  a = [];
  b = [];
  c = [];
  d = [];
  for (var p=0; p<close.length-2; p++){
    z.push((open[p + 1] - open[p])/open[p]);
    a.push((close[p + 1] - close[p])/close[p]);
    b.push((high[p + 1] - high[p])/high[p]);
    c.push((low[p + 1] - low[p])/low[p]);
    d.push((volume[p + 1] - volume[p])/volume[p]);
  }

  const output = [];
  for (var p=0; p<z.length-33; p++){
    var ans = (a[p+31]+a[p+32]+a[p+33])>0;
    var steps = [];
    for (var i=0; i<30; i++){
      var timelist = [];
      timelist.push(z[p+i]);
      timelist.push(a[p+i]);
      timelist.push(b[p+i]);
      timelist.push(c[p+i]);
      timelist.push(d[p+i]);
      steps.push(timelist);
    }
    if (Math.max.apply(Math, steps.flat())<10 && Math.min.apply(Math, steps.flat())>-10){
      output.push([steps, ans]);
    }
  }
  
  //  const digitArray = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  //  const arraySize = digitArray.length;
 
  //  const output = [];
  //  const maxLen = digits + 1 + digits;
 
  //  const f = () => {
  //    let str = '';
  //    while (str.length < digits) {
  //      const index = Math.floor(Math.random() * arraySize);
  //      str += digitArray[index];
  //    }
  //    return Number.parseInt(str);
  //  };
 
  //  const seen = new Set();
  //  while (output.length < numExamples) {
  //    const a = f();
  //    const b = f();
  //    const sorted = b > a ? [a, b] : [b, a];
  //    const key = sorted[0] + '`' + sorted[1];
  //    if (seen.has(key)) {
  //      continue;
  //    }
  //    seen.add(key);
 
  //    // Pad the data with spaces such that it is always maxLen.
  //    const q = `${a}+${b}`;
  //    const query = q + ' '.repeat(maxLen - q.length);
  //    let ans = (a + b).toString();
  //    // Answer can be of maximum size `digits + 1`.
  //    ans += ' '.repeat(digits + 1 - ans.length);
 
  //    if (invert) {
  //      throw new Error('invert is not implemented yet');
  //    }
  //    output.push([query, ans]);
  //  }
   return output;
 }
 
 function convertDataToTensors(data) {
   const questions = data.map(datum => datum[0]);
   const answers = data.map(datum => datum[1]);
   return [
    tf.tensor(questions),
    tf.tensor(answers)
   ];
 }
 
 function createAndCompileModel(
      hiddenSize, rnnType) {
 
   const model = tf.sequential();
   switch (rnnType) {
     case 'Conv1D':
        model.add(tf.layers.conv1d({
         filters: hiddenSize,
         kernelSize: 3,
         inputShape: [30, 5],
         activation: "relu",
         padding: "same"
        }));
        model.add(tf.layers.conv1d({
          filters: hiddenSize,
          kernelSize: 3,
          activation: "relu",
          padding: "same"
        }));
        model.add(tf.layers.maxPool1d({
          poolSize:2,
        }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.flatten());
       break;
     case 'LSTM':
       model.add(tf.layers.lstm({
         units: hiddenSize,
         recurrentInitializer: 'glorotNormal',
         inputShape: [30, 5]
       }));
       break;
     case 'SimpleRNN':
       model.add(tf.layers.simpleRNN({
         units: hiddenSize,
         recurrentInitializer: 'glorotNormal',
         inputShape: [30, 5]
       }));
       break;
     default:
       throw new Error(`Unsupported RNN type: '${rnnType}'`);
   }
   model.add(tf.layers.dense({units: 32, activation: "tanh"}));
   model.add(tf.layers.dropout({rate: 0.4}));
   model.add(tf.layers.dense({units: 1, activation: "sigmoid"}));
   model.compile({
     loss: 'binaryCrossentropy',
     optimizer: 'adam',
     metrics: ['accuracy']
   });
   console.log(model.summary());
   return model;
 }
 
 class AdditionRNNDemo {

   async getdata(rnnType, hiddenSize, stock) {
    console.log('Generating training data');
    const data = await generateData(false, stock)
    const split = Math.floor(data.length * 0.9);
    this.trainData = data.slice(0, split);
    this.testData = data.slice(split);
    [this.trainXs, this.trainYs] =
        convertDataToTensors(this.trainData);
    [this.testXs, this.testYs] =
        convertDataToTensors(this.testData);
    console.log(this.trainXs, this.trainYs);
    this.model = createAndCompileModel(
        hiddenSize, rnnType);

   }
 
   async train(iterations, batchSize) {
     const lossValues = [[], []];
     const accuracyValues = [[], []];
     console.log(this.trainXs);
     for (let i = 0; i < iterations; ++i) {
       const beginMs = performance.now();
       console.log(this.trainXs, this.trainYs);
       console.log(this.testXs, this.testYs);
       const history = await this.model.fit(this.trainXs, this.trainYs, {
         epochs: 1,
         batchSize,
         validationData: [this.testXs, this.testYs],
         yieldEvery: 'epoch'
       });
       console.log(Math.max.apply(Math, this.testXs), Math.min.apply(Math, this.testXs));
       const elapsedMs = performance.now() - beginMs;
       const modelFitTime = elapsedMs / 1000;
 
       const trainLoss = history.history['loss'][0];
       const trainAccuracy = history.history['acc'][0];
       const valLoss = history.history['val_loss'][0];
       const valAccuracy = history.history['val_acc'][0];
 
       lossValues[0].push({'x': i, 'y': trainLoss});
       lossValues[1].push({'x': i, 'y': valLoss});
 
       accuracyValues[0].push({'x': i, 'y': trainAccuracy});
       accuracyValues[1].push({'x': i, 'y': valAccuracy});
 
       document.getElementById('trainStatus').textContent =
           `Iteration ${i + 1} of ${iterations}: ` +
           `Time per iteration: ${modelFitTime.toFixed(3)} (seconds)`;
       const lossContainer = document.getElementById('lossChart');
       tfvis.render.linechart(
           lossContainer, {values: lossValues, series: ['train', 'validation']},
           {
             width: 420,
             height: 300,
             xLabel: 'epoch',
             yLabel: 'loss',
           });
 
       const accuracyContainer = document.getElementById('accuracyChart');
       tfvis.render.linechart(
           accuracyContainer,
           {values: accuracyValues, series: ['train', 'validation']}, {
             width: 420,
             height: 300,
             xLabel: 'epoch',
             yLabel: 'accuracy',
           });

      
      //  const examples = [];
      //  const isCorrect = [];
      //  tf.tidy(() => {
      //    const predictOut = this.model.predict(this.testXsForDisplay);
      //    for (let k = 0; k < numTestExamples; ++k) {
      //      const scores =
      //          predictOut
      //              .slice(
      //                  [k, 0, 0], [1, predictOut.shape[1], predictOut.shape[2]])
      //              .as2D(predictOut.shape[1], predictOut.shape[2]);
      //      const decoded = this.charTable.decode(scores);
      //      examples.push(this.testData[k][0] + ' = ' + decoded);
      //      isCorrect.push(this.testData[k][1].trim() === decoded.trim());
      //    }
      //  });
 
      //  const examplesDiv = document.getElementById('testExamples');
      //  const examplesContent = examples.map(
      //      (example, i) =>
      //          `<div class="${
      //              isCorrect[i] ? 'answer-correct' : 'answer-wrong'}">` +
      //          `${example}` +
      //          `</div>`);
 
      //  examplesDiv.innerHTML = examplesContent.join('\n');
     }
   }
 }
 
 async function runAdditionRNNDemo() {
   document.getElementById('trainModel').addEventListener('click', async () => {
      const stock = document.getElementById('stock').value;
     const rnnTypeSelect = document.getElementById('rnnType');
     const rnnType =
         rnnTypeSelect.options[rnnTypeSelect.selectedIndex].getAttribute(
             'value');
     const hiddenSize = +(document.getElementById('hiddenSize')).value;
     const batchSize = +(document.getElementById('batchSize')).value;
     const trainIterations = +(document.getElementById('trainIterations')).value;
 
     const demo =
         new AdditionRNNDemo();
      await demo.getdata(rnnType, hiddenSize, stock);
      await demo.train(trainIterations, batchSize);
   });
 }
 
 runAdditionRNNDemo();