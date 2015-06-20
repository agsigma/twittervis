<?php
// https://code.google.com/p/phpquery/
require_once "phpQuery-onefile.php";
$url = array_key_exists('url', $_GET) ? $_GET['url'] : 'http://www.onet.pl';
$metaCharset = '';
//$url = "http://wyborcza.pl/1,75478,18134595,Robert_Biedron_nie_wpuszcza_do_Slupska_znanego_cyrku_.html";
//$url = "http://wyborcza.pl/1,75478,18134595,Robert_Biedron_nie_wpuszcza_do_Slupska_znanego_cyrku_.html?squid_js=false";
$encoding = 'ISO-8859-2';
$html = file_get_contents($url);
// http://stackoverflow.com/questions/2236668/file-get-contents-breaks-up-utf-8-characters
$html = mb_convert_encoding($html, 'HTML-ENTITIES', "UTF-8");
//$html = file_get_contents('http://eurosport.onet.pl/koszykowka/plk/gala-tauron-basket-ligi-w-centrum-olimpijskim-zwienczyla-sezon-2014-2015/ym0km2');
//$html = file_get_contents('http://www.bbc.co.uk');
//$doc['script']
$doc = phpQuery::newDocumentHTML($html);
// echo $doc->html(); die(0);


$charset = 'UTF-8';
pQ('meta[charset]')->each(function($el) {
	global $charset;
	$charset = pQ($el)->attr('charset');
	// echo $charset;
});

$doc = phpQuery::newDocumentHTML($html, $charset);
$doc['script, link']->remove();
$doc['*']->removeAttr('style');
$doc['head']->empty();

/*
// https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.4/css/bootstrap.css
pQ('<link></link>')
	->attr('rel', 'stylesheet')
	->attr('href', 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.4/css/bootstrap.css')
	->appendTo($doc['head']);
// style.css
pQ('<link></link>')
	->attr('rel', 'stylesheet')
	->attr('href', 'style.css')
	->appendTo($doc['head']);
pQ('body *')->filter(function($index, $el) {
	// echo pQ($el)->text() + "\n" + preg_match('/^\s*$/', pQ($el)->text());
	// echo "--------\n";
	return preg_match('/^\s*$/', pQ($el)->text());
})->remove();
*/

// przenosimy klasy
pQ('body *')->each(function($el) {
	pQ($el)->attr('oldClasses', pQ($el)->attr('class'));
	pQ($el)->removeAttr('class')->addClass('alienElement');
});

// linki zamieniamy na przechodzace przez ten skrypt
pQ('body a')->each(function($el) {
	$href = pQ($el)->attr('href');
	// echo "href: " . $href . " : " . pQ($el)->text() . "\n";
	pQ($el)->attr('oldHref', $href);
	//pQ($el)->attr('href', '?url=' . $href);
});

// zamiana list na nav nav-pills
// pQ('ul')->addClass('nav nav-pills');

// dodanie klasy table do tabel
pQ('table')->addClass('table table-condensed');

// jesli element blokowy(na tera div) ma tylko jedno blokowe dziecko to go usuwamy
// albo i nie

//echo "----------\n";
//var_dump($bootstrap);
?><!DOCTYPE html>
<html>
<head>	
	<meta charset="<?php echo $charset;?>">
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>
	<script src="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.4/js/bootstrap.min.js"></script>
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.4/css/bootstrap.css">
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.4/css/bootstrap-theme.css">	
	<link rel="stylesheet" href="style.css">	
	<script>
		var getBaseUrl = function(url) {
			var l = document.createElement("a"), res; 
			l.href = url;
			res = new String(l.origin + l.pathname);
			res.origin = l.origin;
			res.pathname = l.pathname;
			return res;
		}
		// przydalabysie normalizacja baseUrl
		var baseUrl = '<?php echo $url; ?>'; 	
		baseUrl = getBaseUrl(baseUrl);
		function absolutePath(base, relative) {
			var stack, parts;
			if (/^(http|\/\/|ftp)/.exec(relative)) {
				return relative;
			}						
			if (relative && relative[0] == '/') {				
				console.log(base, relative);
				base = base.origin + '/dummy.php';
				relative = relative.substr(1);
			}
			stack = base.split("/"),
			parts = relative.split("/");
			stack.pop(); // remove current file name (or empty string)
						 // (omit if "base" is the current folder without trailing slash)
			for (var i=0; i<parts.length; i++) {
				if (parts[i] == ".")
					continue;
				if (parts[i] == "..")
					stack.pop();
				else
					stack.push(parts[i]);
			}
			return stack.join("/");
		}
		
		var addImage = function(src, elem, title) {			
			var addImage = function(src) {
				var popover = $('<div />')
					.attr('src', src)
					.css({
						'width' : '250px', 
						'height' : '250px',
						'background-image' : 'url(\'' + src + '\')',
						'background-size' : 'contain',
						'background-position' : '50% 50%',
						'background-repeat' : 'no-repeat'
					});
				//console.log('  >> ', image, image[0].outerHTML);
				$('<span />')
					.css({
						'background-image' : 'url(\'' + src + '\')',					
					})
					.addClass('imageMini')
					.text('-')
					.popover({
						content: popover[0].outerHTML, 
						html: true, 
						trigger: 'hover',
						title: title || ""
					})
					.prependTo(elem);
				}
				src = src.replace(/%20$/, '');
				src = src.trim();				
				addImage(src, elem, title);
				addImage('fileproxy.php?url=' + src, elem, title);
		}
		
		$(document).ready(function() {
			
			// zamieniamy obrazzki na spany z textem alternatywnym
			$('.parsedContent2321 img[src]').each(function() {	
				var src = absolutePath(baseUrl, $(this).attr('src'));
				var alt = $(this).attr('alt');
				var newImg = $('<span />')
					.text(alt || '')
					//.css({'padding' : '5px', 'border' : '1px solid red'})
					.attr('imgsrc', src);					
				$('<span />')
					.addClass('glyphicon glyphicon-picture')
					.css('font-size', '125%')
					.text('-')
					.each(function() { // tooltip						
						var image = $('<div />')
							.attr('src', src)
							.css({
								'width' : '250px', 
								'height' : '250px',
								'background-image' : 'url(\'' + src + '\')',
								'background-size' : 'contain',
								'background-position' : '50% 50%',
								'background-repeat' : 'no-repeat'
							});
						console.log('  >> ', image, image[0].outerHTML);
						$(this).popover({
							content: image[0].outerHTML, 
							html: true, 
							trigger: 'hover',
							title: alt
						});						
					})
					.click(function() {
						//$(this).popover('show');
						console.log('aaa');
						return false;
					})
					.prependTo(newImg);
				addImage(src, newImg);				
				// console.log(newImg, newImg.parent());
				newImg.insertAfter(this);
				$(this).remove();
			});			
			
			$('.parsedContent2321 ul, .parsedContent2321 ol')
				.filter(function() {
					return !$(this).find('ul, ol').length;
					// return !$(this).find('div, article, section, ul, ol').length;
				})
				.addClass('nav nav-pills')				
				.find('li')
				.css('border', '1px dashed #666');
				//.has('& > :not(a)')
				//.wrapInner('<a/>');
				
			// usuwamy puste elementy
			$('.parsedContent2321')
				.find('div, nav, ul, ol, p, a, span, section, article')
				.filter(function() {
					// console.log($(this).text(), $(this).text().replace(/\s+/gm, ''), this);
					return !$(this).hasClass('glyphicon') && $(this).text().replace(/\s+/gm, '') == '';
				}).remove();
			$('.parsedContent2321 div > div')
				.filter(function() {
					return $(this).text().replace(/\s+/gm, '') == $(this).parent().text().replace(/\s+/gm, '');
				})
				.parent()
				.addClass('dummyContainer');
				
			$('.parsedContent2321 a[oldHref]').each(function() {
				var oldHref = $(this).attr('oldHref');
				if (/^#/.exec(oldHref)) { // kotwica
					$(this).attr('href', oldHref);
				} else {
					$(this).attr('href', '?url=' + absolutePath(baseUrl, oldHref));
				}
			}); 
			
			// jesli link do obrazka to ustawiamy background image
			$('.parsedContent2321 a[href]').each(function() {
				var href = $(this).attr('oldHref');
				if (/(gif|png|jpg|jpeg)$/.exec(href)) { // kotwica
					addImage(href, this);
				}
			}); 
		});
	</script>
</head>
<body style="padding-top: 50px;">
<div nav class="navbar navbar-default navbar-fixed-top">
	<div class="container-fluid">	
		<!-- Collect the nav links, forms, and other content for toggling -->
		<div class="collapse navbar-collapse" id="bs-example-navbar-collapse-8">
			<form class="navbar-form navbar-left" role="search" action="" method="get">
				<div class="form-group">
					<input type="text" class="form-control" name="url" value="<?php echo $url;?>">
				</div>
				<button type="submit" class="btn btn-default">Go</button>
			</form>		
			<div class="navbar-form navbar-right">
				<a class="btn btn-primary" href="<?php echo $url; ?>" target="_blank">Open</a>				
			</div>  
		</div><!-- /.navbar-collapse -->	
	</div>
</div>

<div class="parsedContent2321">
<?php
	echo pQ('body')->html();
?>
</div>
<textarea style="width: 100%; height: 600px;>
	<?php echo $html; ?>
</textarea>
</body>
</html>
