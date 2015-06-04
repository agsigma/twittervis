cross = function(dx1, dy1, dx2, dy2) {	
	return Math.sign(dx1*dy2 - dx2*dy1);
}

crossA = function(p0, p1, q) {	
	return cross(p1[0]-p0[0], p1[1]-p0[1], q[0]-p0[0], q[1]-p0[1]);
}

intersect = function(p0, p1, q0, q1) {
	if (crossA(p0, p1, q0) == -crossA(p0, p1, q1) && crossA(q0, q1, p0) == -crossA(q0, q1, p1)) {
		return true;
	}
	return false;
}

insidePolygon = function(poly, p) {
	var intersectNo = 0;
	var l1, infP, maxCoord=0, alpha;	
	for (l1 = 0; l1 < poly.length; l1++) {
		maxCoord = Math.max(maxCoord, Math.abs(poly[l1][0]));
		maxCoord = Math.max(maxCoord, Math.abs(poly[l1][1]));
	}
	alpha = Math.random()*Math.PI*2;
	infP = [maxCoord * 10 * Math.cos(alpha), maxCoord * 10 * Math.sin(alpha)];
	//console.log(infP);
	for (l1 = 0; l1 < poly.length; l1++) {
		intersectNo += intersect(poly[l1], poly[(l1+1)%poly.length], p, infP) ? 1 : 0;		
		//console.log(poly[l1], poly[(l1+1)%poly.length], p, infP, intersect(poly[l1], poly[(l1+1)%poly.length], p, infP));
	}
	return intersectNo%2 ? true : false;
}

function center(poly) {
	var l1,x=0,y=0; 
	for(l1=0;l1<poly.length; l1++) {
		x+=poly[l1][0]; y+=poly[l1][1];
	} 
	return [x/poly.length, y/poly.length];
}

insideGeo = function(geo, p) { 
	var polys = [], l1, res = false;	
	p = p || [0,0];
	// console.log('1', geo.properties);
	if (geo.geometry.type == "Polygon") {
		polys.push(geo.geometry.coordinates[0]);
	}
	// console.log('2', geo.properties);
	if (geo.geometry.type == "MultiPolygon") {
		for (l1 = 0; l1 < geo.geometry.coordinates.length; l1++) {
			polys.push(geo.geometry.coordinates[l1][0]);
		}		
	}
	// console.log('3', geo.properties);
	for (l1 = 0; l1 < polys.length; l1++) {		
		res = res || insidePolygon(polys[l1], p);
		// console.log(geo.properties.name, res);
	}			
	return res;
}
