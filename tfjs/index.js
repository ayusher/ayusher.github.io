function tanh(x) {
    e = Math.exp(2*x);
    return (e - 1) / (e + 1) ;
}

async function run_tickers(){
    const model = await tf.loadGraphModel('https://www.ayushrautwar.com/tfjs/model.json');
    var tickers = ["AAPL", "TSLA", "MSFT", "FB"];
    var l;
    var n;
    var url;
    var time = +new Date;
    var starttime = time-90*24*60*60;
    for (var i=0; i<tickers.length; i++){
        url = "https://cors-anywhere.herokuapp.com/query1.finance.yahoo.com/v7/finance/chart/"+tickers[i]+"?symbol="+tickers[i]+"&interval=1d&period0="+starttime+"&period2="+time;
        let response = await fetch(url);
        var json;
        if (response.ok) { // if HTTP-status is 200-299
            // get the response body (the method explained below)
            json = await response.json();
        } else {
            alert("HTTP-Error: " + response.status);
        }
        l = json.chart.result[0].indicators.quote[0].close.slice(-30);

        n = [0];
        //console.log(l);
        //console.log(l.length);
        for (var p=0; p<l.length-1; p++){
            n.push(tanh(10*(l[p + 1] - l[p])/l[0]));
        }
        //console.log(n);
        var d = {0: "HOLD", 1: "BUY", 2: "SELL"};
        var d2 = {0: "yellow", 1: "green", 2: "red"};
        var out = tf.gather(model.predict(tf.tensor([n])), 0);
        //console.log(out);
        var ans = out.argMax();
        var ans = ans.dataSync()[0];
        //console.log(d2[ans]);
        document.getElementById(""+(i+1)).style.borderColor= d2[ans];
        document.getElementById(""+(i+1)).children[0].textContent=tickers[i];
        console.log(""+Math.round(out.arraySync()[ans]*100)+"%");
        console.log(document.getElementById(""+(i+1)).children[1].children[1]);
        var temp = ""+Math.round(out.arraySync()[ans]*100)+"%";
        document.getElementById(""+(i+1)).children[1].children[1].style.width=temp;
        document.getElementById(""+(i+1)).children[1].children[2].textContent=temp;
        document.getElementById(""+(i+1)).children[1].children[3].textContent="confident";
        document.getElementById(""+(i+1)).children[1].children[4].textContent=d[ans];
        
    }
}