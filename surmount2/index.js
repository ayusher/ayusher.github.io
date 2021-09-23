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
  //var tick = stock;
  document.getElementById('stock').style["width"] = 9*document.getElementById('stock').value.length +"px";

  var ticks = stock.split(" ").join("").split(",");
  var time = +new Date;
  time = Math.floor(time/1000);
  var starttime = Math.floor(time-10*365*24*60*60);
  var jsons = [];
  for (var tick=0; tick<ticks.length; tick++){
    url = "https://gentle-flower-8de4.lambdacors.workers.dev?https://query1.finance.yahoo.com/v7/finance/chart/"+ticks[tick]+"?symbol="+ticks[tick]+"&interval=1d&period1="+0+"&period2="+time;
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
    jsons.push(json);
  }
  var minlength = 999999;
  for (var ind=0; ind<jsons.length; ind++){
    if (jsons[ind].chart.result[0].indicators.quote[0].close.length<minlength){
      minlength = jsons[ind].chart.result[0].indicators.quote[0].close.length;
    }
  }
  for (var ind=0; ind<jsons.length; ind++){
    jsons[ind] = jsons[ind].chart.result[0].indicators.quote[0].close.slice(-minlength);
  }

  var big = [];
  for (var p=0; p<minlength-2; p++){
    a = [];
    for (var ind=0; ind<jsons.length; ind++){
      close = jsons[ind];
      a.push((close[p + 1] - close[p])/close[p]);
    }
    big.push(a);
  }
  console.log(big);
  function argMax(array) {
    return array.map((x, i) => [x, i]).reduce((r, a) => (a[0] > r[0] ? a : r))[1];
  }

  const output = [];
  for (var p=0; p<big.length-35; p++){
    var list = [big[p+31], big[p+32], big[p+33], big[p+34], big[p+35]];
    var ans = argMax(list.reduce((a, b) => a.map((c, i) => c + b[i])));
    var steps = big.slice(p, p+30);
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
      hiddenSize, rnnType, stock) {
   const num = stock.split(" ").join("").split(",").length;
   const model = tf.sequential();
   switch (rnnType) {
     case 'Conv1D':
        model.add(tf.layers.gaussianNoise({
          stddev: 0.004,
          inputShape: [30, num]
        }));
        model.add(tf.layers.conv1d({
         filters: hiddenSize,
         kernelSize: 3,
         inputShape: [30, num],
         activation: "relu",
         padding: "same"
        }));
        model.add(tf.layers.conv1d({
          filters: hiddenSize,
          kernelSize: 3,
          activation: "relu",
          padding: "same"
        }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.maxPool1d({
          poolSize:2,
        }));
        model.add(tf.layers.dropout({rate: 0.25}));

        model.add(tf.layers.conv1d({
          filters: hiddenSize*4,
          kernelSize: 3,
          activation: "relu",
          padding: "same"
        }));
        model.add(tf.layers.batchNormalization());
        model.add(tf.layers.maxPool1d({
          poolSize:2,
        }));
        model.add(tf.layers.dropout({rate: 0.25}));
        model.add(tf.layers.flatten());
       break;
     case 'LSTM':
       model.add(tf.layers.lstm({
         units: hiddenSize,
         recurrentInitializer: 'glorotNormal',
         inputShape: [30, num]
       }));
       break;
     case 'SimpleRNN':
       model.add(tf.layers.simpleRNN({
         units: hiddenSize,
         recurrentInitializer: 'glorotNormal',
         inputShape: [30, num]
       }));
       break;
     default:
       throw new Error(`Unsupported RNN type: '${rnnType}'`);
   }
   model.add(tf.layers.dense({units: 64, activation: "relu"}));
   model.add(tf.layers.dropout({rate: 0.4}));
   model.add(tf.layers.dense({units: num, activation: "softmax"}));
   model.compile({
     loss: 'sparseCategoricalCrossentropy',
     optimizer: tf.train.adam(0.0002),
     metrics: ['accuracy']
   });
   console.log(model.summary());
   return model;
 }
 
 class AdditionRNNDemo {
   async backtest() {
    function dot_product(vector1, vector2) {
      console.log(vector1, vector2);
      let result = 0;
      for (let i = 0; i < 3; i++) {
        result += vector1[i] * vector2[i];
      }
      return result;
    }
    var preds = await this.model.predict(this.testXs);
    var preds2 = preds.arraySync();
    var vallist = [100000];
    //dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n);
    for(var i=0; i<preds2.length-1; i++){
      vallist.push(vallist.slice(-1)[0]*(1+dot_product(preds2[i], this.testXs.arraySync()[i+1].slice(-1)[0])));
    }


    // BASELINE
    var time = +new Date;
    time = Math.floor(time/1000);
    url = "https://gentle-flower-8de4.lambdacors.workers.dev?https://query1.finance.yahoo.com/v7/finance/chart/"+"SPY"+"?symbol="+"SPY"+"&interval=1d&period1="+0+"&period2="+time;
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
    var closes = json.chart.result[0].indicators.quote[0].close.slice(-1*vallist.length)
    var firstnum = closes[0];
    for (var i =0; i<closes.length; i++){
      closes[i] = closes[i]/firstnum*vallist[0];
    }

    console.log(vallist);
    const data = {
      labels: [...Array(vallist.length).keys()],
      datasets: [
      {
        label: 'AI portfolio value',
        backgroundColor: 'rgb(52, 76, 235)',
        borderColor: 'rgb(52, 76, 235)',
        data: vallist,
      },
      {
        label: 'SPY baseline',
        backgroundColor: 'rgb(84, 84, 84)',
        borderColor: 'rgb(84, 84, 84)',
        data: closes,
      }
    ]
    };
    const config = {
      type: 'line',
      data: data,
      options: { 
        legend: {display: false}
      }
    };

    if (typeof this.myChart !== 'undefined') {
      this.myChart.destroy();
    }
    this.myChart = new Chart(
      document.getElementById('myChart'),
      config
    );
    return;
   }

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
        hiddenSize, rnnType, stock);

   }
 
   async train(iterations, batchSize) {
     const lossValues = [[], []];
     const accuracyValues = [[], []];
     console.log(this.trainXs);
     for (let i = 0; i < iterations; ++i) {
       const beginMs = performance.now();
       console.log(this.trainXs, this.trainYs);
       console.log(this.testXs, this.testYs);
       var n = 1;
       const history = await this.model.fit(this.trainXs, this.trainYs, {
         epochs: n,
         batchSize,
         validationData: [this.testXs, this.testYs],
         yieldEvery: 'epoch'
       });
       //console.log(Math.max.apply(Math, this.testXs), Math.min.apply(Math, this.testXs));
       const elapsedMs = performance.now() - beginMs;
       const modelFitTime = elapsedMs/n / 1000;
       for (var x=0; x<n; x++){
        const trainLoss = history.history['loss'][x];
        const trainAccuracy = history.history['acc'][x];
        const valLoss = history.history['val_loss'][x];
        const valAccuracy = history.history['val_acc'][x];
  
        lossValues[0].push({'x': i, 'y': trainLoss});
        lossValues[1].push({'x': i, 'y': valLoss});
  
        accuracyValues[0].push({'x': i, 'y': trainAccuracy});
        accuracyValues[1].push({'x': i, 'y': valAccuracy});
       }
       
 
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
 
 async function runAdditionRNNDemo(demo) {
   document.getElementById('trainModel').addEventListener('click', async () => {
      const stock = document.getElementById('stock').value;
     const rnnTypeSelect = document.getElementById('rnnType');
     const rnnType =
         rnnTypeSelect.options[rnnTypeSelect.selectedIndex].getAttribute(
             'value');
     const hiddenSize = +(document.getElementById('hiddenSize')).value;
     const batchSize = +(document.getElementById('batchSize')).value;
     const trainIterations = +(document.getElementById('trainIterations')).value;
 

      await demo.getdata(rnnType, hiddenSize, stock);
      await demo.train(trainIterations, batchSize);
      await demo.backtest();
   });
 }
 const demo = new AdditionRNNDemo();
 runAdditionRNNDemo(demo);