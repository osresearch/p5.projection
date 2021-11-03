/*
 * See https://github.com/osresearch/p5.projection for the math!
 *
 * Inspired by OpenCV perspectiveTransform()
 * https://docs.opencv.org/3.4/d2/de8/group__core__array.html#gad327659ac03e5fd6894b90025e6900a7
 */
class ProjectionMatrix
{
constructor(outPts=null, inPts=null)
{
	// default is a full HD canvas
	this.inPts = inPts ? inPts : [
		[   0,    0],
		[   0, 1080],
		[1920,    0],
		[1920, 1080],
	];

	// default is a slightly skewed rectangle
	this.outPts = outPts ? outPts : [
		[ -700, -400 ],
		[ -650, +300 ],
		[ 600, -150 ],
		[ 500, +450 ],
	];

	// pre-compute the forward and reverse projection matrices
	this.update();
}


/*
 * After updating inPts or outPts, update() must be called
 * to recompute the inverse and forward projection matrices.
 * This is potentially expensive, so it should only be called
 * when necessary.
 */
update()
{
	this.mat = this.projectionMatrix(this.inPts, this.outPts);
	this.invmat = this.projectionMatrix(this.outPts, this.inPts);
}

projectionMatrix(inPts, outPts)
{
	const x0 = inPts[0][0];
	const x1 = inPts[1][0];
	const x2 = inPts[2][0];
	const x3 = inPts[3][0];

	const y0 = inPts[0][1];
	const y1 = inPts[1][1];
	const y2 = inPts[2][1];
	const y3 = inPts[3][1];

	const u0 = outPts[0][0];
	const u1 = outPts[1][0];
	const u2 = outPts[2][0];
	const u3 = outPts[3][0];

	const v0 = outPts[0][1];
	const v1 = outPts[1][1];
	const v2 = outPts[2][1];
	const v3 = outPts[3][1];

	const U = [
		[x0, y0, 1, 0, 0, 0, -x0*u0, -y0*u0],
		[x1, y1, 1, 0, 0, 0, -x1*u1, -y1*u1],
		[x2, y2, 1, 0, 0, 0, -x2*u2, -y2*u2],
		[x3, y3, 1, 0, 0, 0, -x3*u3, -y3*u3],
		[0, 0, 0, x0, y0, 1, -x0*v0, -y0*v0],
		[0, 0, 0, x1, y1, 1, -x1*v1, -y1*v1],
		[0, 0, 0, x2, y2, 1, -x2*v2, -y2*v2],
		[0, 0, 0, x3, y3, 1, -x3*v3, -y3*v3],
	];

	const b = [u0, u1, u2, u3, v0, v1, v2, v3];

	let m = math.lusolve(U, b).map((x) => x[0]);

	m.push(1); // c22 = 1

	return m;
}


drawCorner(n)
{
	push();

	const muv = this.project(mouseX - width/2, mouseY - height/2);
	const mx = muv[0];
	const my = muv[1];
	const px = this.inPts[n][0];
	const py = this.inPts[n][1];

	let w = 20;

	const hit = px - w/2 <= mx && mx <= px + w/2 && py - w/2 <= my && my <= py + w/2;

	fill(0,255,0);

	if (hit)
	{
		translate(0,0,1)
		fill(255,0,0);
		w *= 2;
		this.hit = n;
	}

	rect(this.inPts[n][0]-w/2, this.inPts[n][1]-w/2, w, w);

	pop();
}

drawBorder()
{
	push();

	// draw the border in a thick line
	strokeWeight(5);
	stroke(0,255,0);
	noFill();
	beginShape();
	vertex(this.inPts[0][0], this.inPts[0][1]);
	vertex(this.inPts[1][0], this.inPts[1][1]);
	vertex(this.inPts[3][0], this.inPts[3][1]);
	vertex(this.inPts[2][0], this.inPts[2][1]);
	vertex(this.inPts[0][0], this.inPts[0][1]);
	endShape();
	pop();

	// draw the corners slightly larger and highlighted if the mouse
	// is over them.  record if we have a hit for the mouse drag event
	this.hit = -1;
	this.drawCorner(0);
	this.drawCorner(1);
	this.drawCorner(2);
	this.drawCorner(3);
}

drawMouse()
{
	// draw the mouse cross hairs in red and blue
	push();
	strokeWeight(1);
	stroke(0,0,255);
	noFill();
	const uv = this.project(mouseX - width/2, mouseY - height/2);
	line(-500, uv[1], 1920 + 500, uv[1]);
	stroke(255,0,0);
	line(uv[0], -500, uv[0], 1080 + 500);
	pop();
}

mouseDragged(n)
{
	this.outPts[n][0] = mouseX - width/2;
	this.outPts[n][1] = mouseY - height/2;

	// compute the forward and inverse projection matrices
	mat.update();
}


/*
 * matrix is c00, c01, c02, c10, c11, c12, c20, c21, c22
 * ui = c00*xi + c01*yi + c02
 * vi = c10*xi + c11*yi + c12
 * zi = c20*xi + c21*yi + c22
 */
apply(debug=false)
{
	const mat = this.mat;

	applyMatrix(
		mat[0], mat[3], 0, mat[6],
		mat[1], mat[4], 0, mat[7],
		0,      0,      1, 0,
		mat[2], mat[5], 0, mat[8]);


	this.hit = -1;

	if (debug >= 1)
		this.drawBorder();

	if (debug >= 2)
		this.drawMouse();

	return this.hit;
}

/*
 * convert screen coordinates to canvas coordinates
 * Remember that mouseX and mouseY are from the upper-left,
 * but the canvas is centered on the screen.
 */
project(x, y)
{
	const mat = this.invmat;
	const u = mat[0]*x + mat[1]*y + mat[2];
	const v = mat[3]*x + mat[4]*y + mat[5];
	const z = mat[6]*x + mat[7]*y + mat[8];

	return [ u/z, v/z ];
}
}
