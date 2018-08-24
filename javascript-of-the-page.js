
//    const sito = './'
const sito = 'http://itselemental.altervista.org/lancio/'

// var personaggi=[
//     {
//         nome: "Helium",
//         fisico: 11,
//         mente: 22,
//         controllo: 33,
//     }
// ]

/// Carico il json dei personaggi. Fra qualche anno sarà più semplice farlo
var personaggi = (function() {
    var cfg = null;
    $.ajax({
        'async': false,
        'global': false,
        'url': "./personaggi.json",
        'dataType': "json",
        'success': function (d) {
            cfg = d;
        }
    });
    return cfg;
})();

var bonusmalus= [-2, -1, 0, +1, +2]

//////////// Popolo il form /////////////////
var form = d3.select("form")

/// Appendo la lista dei personaggi
var select = d3.select('select')
    .on('change',onchange) /// ogni volta che viene cambiato personaggio, chiamo la funzione onchange

var options = select
    .selectAll('option')
    .data(personaggi).enter()
      .append('option')
    .attr('value',function(d,i){return i})
    .text(function(d){return d.nome});

/// Appendo la lista di bonus e malus
var radio = d3.select('#bonusmalus')

var rad = radio
    .selectAll('label')
    .data(bonusmalus).enter()
      .append('label')
    .attr('class',function(d){return d==0 ? 'btn btn-primary col active' : 'btn btn-primary col'})
    .text(function(d){return d})
      .append('input')
    .attr('type','radio')
    .attr('name','boma')
    .attr('checked',function(d){return d==0 ? 'checked' : null})
    .attr('autocomplete','off')
    .attr('id', function(d){return "boma"+d})
    .attr('value',function(d){return d})

/// Appendo i bottoni
var dummy0 = Object.assign({}, personaggi[0]) /// prendo il primo personaggio per avere la lista dei valori
delete dummy0.nome;              /// taglio il nome per ottenere solo  fisico, mente, controllo
var entry0= d3.entries(dummy0)   /// [{key: "fisico", value: 0}, {key: "mente", value: 0} etc.]

var pulsanti = d3.select("#pulsanti")

var buttons = pulsanti
    .selectAll('button')
    .data(entry0).enter()
      .append('button')
    .attr('type','button')
    .attr('class','btn btn-primary col')
    .text(function(d){return d.key})
    .on('click',onclick) /// quando clicco chiamo la funzione onclick che lancia il dado

/// Appendo la lista delle caratteristiche
var dl= d3.select("dl#cara")

onchange() /// chiamo almeno una volta la funzione per ottenere una lista iniziale

getTable();/// chiamo almeno una volta per ottenere la tabella

    
//////////// Creo la svg /////////////////
var svg = d3.select("figure").append("svg")

// margini, larghezza ed altezza dell'immagine svg (in pixel)
var margin = {top: 30, right: 20, bottom: 30, left: 20},
    width = 200 - margin.left - margin.right,
    height = 200 - margin.top - margin.bottom;

svg.attr("xmlns", "http://www.w3.org/2000/svg") // giusto per essere puntigliosi
    .attr("width", width + margin.left + margin.right) // imposto larghezza
    .attr("height", height + margin.top + margin.bottom) // e altezza
        .style("border", "1px solid black") // non lo faccio nel css perché sennò non vengono esportati
        .style("box-shadow", "4px 4px gray") // non lo faccio nel css perché sennò non vengono esportati
      .append("g") // creo un gruppo e lo traslo del valore dei margini
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

svg
    .append("text")
    .text("elemental")
    .attr("x", -height-50) // non lo faccio nel css perché sennò non vengono esportati
    .attr("y", width+30) // non lo faccio nel css perché sennò non vengono esportati
    .attr("fill", "gray") // non lo faccio nel css perché sennò non vengono esportati
    .attr("transform","rotate(-90)")
    .style("font-size", "30px") // non lo faccio nel css perché sennò non vengono esportati


/// ogni volta che un personaggio viene selezionato, mostra le sue caratteristiche
function onchange() {
    selezionato = d3.select('select').property('value')

    var entries = d3.entries(personaggi[selezionato])

    dl.html( new Array(entries.length + 1).join("<dt/><dd/>") );

    dl.selectAll("dt").data(entries).html(function(d) { return d.key; });
    dl.selectAll("dd").data(entries).html(function(d) { return d.value; });

};


/// ogni volta che un pulsante viene cliccato lancia un dado e mostra il risultato su quella caratteristica
function onclick() {
    selezionato = d3.select('select').property('value') /// id Helium = 0
    caratteristica = d3.select(this).datum() /// {key: "fisico", value: 0}

    var base = personaggi[selezionato][caratteristica.key] /// personaggi['helium'].fisico = 0
    var boma = parseInt(d3.select('input[name="boma"]:checked').node().value)
    var dado = getRandomInt(1,20) /// Tiro un D20 (intero random da 1 a 20)
    var tot = base+boma+dado
    
    d3.select('var')
        .text(base+" "+ ((boma<0?"":"+")+boma) +" +"+dado+" = "+ tot ) /// scrive il risultato

    var date = new Date();

    var filename = "svg/"+date.toISOString()+".svg"
    
    var logjson = {
        data: date.toLocaleString('it-IT'),
        personaggio: personaggi[selezionato].nome,
        caratteristica: caratteristica.key,
        base: base,
        "bon/mal": boma,
        dado: dado,
        totale: tot,
        snippet: filename
    }

    $.ajax({
        type: "POST",
        url: "./writefile.php",
        data: {lancio : logjson},
        async: false,
        dataType: "json"
    })
        .done(getTable())
        .fail(function(e){console.log(e.responseText)});
    
    makesvg(logjson)

    $.ajax({
        type: "POST",
        url: "./writesvg.php",
        data: {image: d3.select("figure").html(), filename:filename},
//        async: false,
        dataType: "json",
    })
        .done(function(d){makesnippet(sito,filename)})
        .fail(function(e){console.log(e.responseText)});
    
};

/// Tira un dado da un valore minimo ad uno massimo
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};


function getTable(){

    var nrows = 17 // numero delle righe della tabella
   
        $.getJSON("./readfile.php", function(res) {  /// chiamo il file php che legge il json
            var last = res.length > nrows ? res.slice(-nrows) : res ; /// se sono meno di 17 li metto tutti, sennò taglio gli ultimi 10
            tabulate(last.reverse(), d3.keys(last[0]), "snippet") /// uso le chiavi della prima riga come intestazione
        })

}

/// Creo la tabella. D3 devi morire
function tabulate(data, columns, link){

    var table = d3.select('table')
    var thead = d3.select('thead')
    var tbody = d3.select('tbody');

    thead.attr('scope','col')

    var th =thead.selectAll('th').data(columns)
    
    th.exit().remove()
    th.enter()
        .append("th")
        .merge(th)
        .text(function(d){return d })

    var rows =tbody.selectAll('tr').data(data)
    
//    rows
    rows.exit().remove()
    rows.enter()
        .append('tr')
        .merge(rows)
        .attr('data-row', function(d,i){return i })
        .attr('href',function(d){return d.snippet })

    var cells = tbody.selectAll('tr')
        .data(data)
        .selectAll('td')
        .data(function (row) {
            return columns.map(function (column) {
                return {column: column, value: row[column]};
            });
        })

//    cells
    cells.exit().remove()
    cells.enter()
        .append("td")
        .merge(cells)
        .attr('data-col',function(d,i){return i })
        .attr('data-key',function(d,i){return d.column })
        .text(function(d,i){return d.value })
        .filter(function(d,i) { return d.column===link })
        .text("")
        .append("a")
        .attr("href", function(d,i) {
            return d.value
        })
        .text( " link" );
    
    return table;    
}

function makesvg(logjson){

    delete logjson.snippet /// I am not interested in the filename in the svg
    var chiavi=d3.keys(logjson) 
    var valori=d3.values(logjson)
    
    var fontsize=15;

    var svg = d3.select("svg g")

    //////////// Creo i nodi di testo vuoti /////////////////
    var testi=svg.selectAll("text") // per ogni nodo di testo che creerò
        .data(valori) // ci attacco i dati

    testi
        .attr("class", function(d,i){return chiavi[i]}) // ognuno con la sua classe presa dal vettore

    testi.exit().remove()

    testi.enter()
          .append("text") // appendo un nodo di testo
        .attr("x",0) // posizione in x (in pixel)
        .attr("y",function(d,i){ return height/valori.length*i+fontsize}) // non è proprio perfetto come allineamento..
        .merge(testi) // ENTER + UPDATE (d3 muori maledetto bastardo)
        .text(function(d,i){return chiavi[i]+": "+d})
        .attr("font-size", fontsize) // non lo faccio nel css perché sennò non vengono esportati
        .attr("font-family", "Helvetica")

}

function makesnippet(sito,filename){
    var snippet = '<img src="'+sito+filename+'" >'
//    console.log(snippet)
    $("code").text(snippet)
}
