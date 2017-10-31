function theme (title = 'Karma', description = '', content = null) {
  return `
<html>
<head>
  <title>devsChile - ${title}</title>
  <link rel="stylesheet" type="text/css" href="//fonts.googleapis.com/css?family=Inconsolata:400,700"/>
  <link rel="stylesheet" type="text/css" href="//cdn.rawgit.com/mutable-tools/MutaGrid/master/demo/mutagrid/dist/5/mutagrid.min.css"/>
  <style>body,html{height:100%;box-sizing:border-box}html{overflow-x:hidden}body{background:#000;color:#ddd;font-size:16px}body,code,pre{font-family:Inconsolata,monospace}code,h1,h2,h3,pre{color:#fff;font-weight:400}a{color:#e74c3c}.text-center{text-align:center}main{padding:5em 1.5em}h1{font-size:18px}h3{margin-top:20px}h2,h3{font-size:16px}hr{opacity:.4}</style>
</head>
<body>
  <main class="container">
    <div class="row">
      <div class="column-5 column-center text-center">
        <h1>devsChile - ${title}</h1>
        <hr/>
        <h2>${description}</h2>
        <hr/>
      </div>
    </div>
    <div class="row">
      <div class="column-2 column-offset-2">
        <ul>
          ${content}
        </ul>
      </div>
    </div>
  </main>
</body>
</html>`
}

module.exports = theme