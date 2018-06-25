
// var personaggi=[
//     {
//         nome: "Helium",
//         fisico: 11,
//         mente: 22,
//         controllo: 33,
//     },
//     {
//         nome: "Moth",
//         fisico: 44,
//         mente: 55,
//         controllo: 66,
//     },
//     {
//         nome: "Cobalt",
//         fisico: 77,
//         mente: 88,
//         controllo: 99,
//     },
//     {
//         nome: "Test",
//         fisico: 1,
//         mente: 2,
//         controllo: 3,
//     },
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

    var logjson = {
        data: new Date().toLocaleString('it-IT'),
        personaggio: personaggi[selezionato].nome,
        caratteristica: caratteristica.key,
        base: base,
        "bon/mal": boma,
        dado: dado,
        totale: tot
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
    
};

/// Tira un dado da un valore minimo ad uno massimo
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};


function getTable(){

    /// chiamo il file php che legge il json
        $.getJSON("./readfile.php", function(res) {
            var last = res.length > 10 ? res.slice(-10) : res ; /// se sono meno di 10 li metto tutti, sennò taglio gli ultimi 10
            tabulate(last.reverse(), d3.keys(last[0])) // uso le chiavi della prima riga come intestazione
        })

}


/// Creo la tabella. D3 devi morire
function tabulate(data, columns){
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
    
    rows.attr('data-row', function(d,i){return i});
    rows.exit().remove()
    rows.enter()
        .append('tr')
        .merge(rows)

    var cells = tbody.selectAll('tr')
        .data(data)
        .selectAll('td')
        .data(function (row) {
            return columns.map(function (column) {
                return {column: column, value: row[column]};
            });
        })

    cells
         .attr('data-col',function(d,i){return i })
         .attr('data-key',function(d,i){return d.value });
    cells.exit().remove()
    cells.enter()
        .append("td")
        .merge(cells)
        .text(function(d,i){return d.value })

    return table;
    
}
