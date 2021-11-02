/*
 * Compute the transform matrix to map four input canvas points in xy space
 * (which are normally cartesian, but don't have to be) into
 * four output screen points in uv space (which are typically a
 * skewed quadralateral and gathered by clicking on screen).
 *
 * For a normal perspective transform matrix C from (x,y) to (u,v),
 * the expanded computation is:
 *
 * zi =  c20*xi + c21*yi + 1
 * ui = (c00*xi + c01*yi + c02) / zi
 * vi = (c10*xi + c11*yi + c12) / zi
 *
 * This can be rearranged into:
 *
 * ui * zi = c00*xi + c01*yi + c02
 * ui * (c20*xi + c21*yi + 1) = c00*xi + c01*yi + c02
 * ui * c20 * xi + ui*c21*yi + ui = c00*xi + c01*yi + c02
 * ui = c00*xi + c01*yi + c02 - c20*(ui*xi) - c21*(ui*yi)
 *
 * and 
 *
 * vi * zi = (c10*xi + c11*yi + c12) / zi
 * vi * (c20*xi + c21*yi + 1) = c10*xi + c11*yi + c12
 * vi = c10*xi + c11*yi + c12 - c20*(vi*xi) - c21*(vi*yi)
 *
 * These eight equations can be rearranged into a linear system
 * that allows the coeffecients of the transformat matrix C to
 * be found.
 *
 * / x0 y0  1  0  0  0 -x0*u0 -y0*u0 \ /c00\ /u0\
 * | x1 y1  1  0  0  0 -x1*u1 -y1*u1 | |c01| |u1|
 * | x2 y2  1  0  0  0 -x2*u2 -y2*u2 | |c02| |u2|
 * | x3 y3  1  0  0  0 -x3*u3 -y3*u3 |.|c10|=|u3|
 * |  0  0  0 x0 y0  1 -x0*v0 -y0*v0 | |c11| |v0|
 * |  0  0  0 x1 y1  1 -x1*v1 -y1*v1 | |c12| |v1|
 * |  0  0  0 x2 y2  1 -x2*v2 -y2*v2 | |c20| |v2|
 * \  0  0  0 x3 y3  1 -x3*v3 -y3*v3 / \c21/ \v3/
 *
 * Inspired by OpenCV perspectiveTransform()
 * https://docs.opencv.org/3.4/d2/de8/group__core__array.html#gad327659ac03e5fd6894b90025e6900a7
 */
function projectionMatrix(inPts, outPts)
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

/*
 * return is c00, c01, c02, c10, c11, c12, c20, c21
 *
 * where:
 *
 * ui = c00*xi + c01*yi + c02
 * vi = c10*xi + c11*yi + c12
 * zi = c20*xi + c21*yi + c22
 *
 * note that c22 is always 1
 */
	m.push(1); // c22 = 1

	return m;
}

/*
 * matrix is c00, c01, c02, c10, c11, c12, c20, c21, c22
 * ui = c00*xi + c01*yi + c02
 * vi = c10*xi + c11*yi + c12
 * zi = c20*xi + c21*yi + c22
 */
function projectionMatrixApply(mat)
{
	applyMatrix(
		mat[0], mat[3], 0, mat[6],
		mat[1], mat[4], 0, mat[7],
		0,      0,      1, 0,
		mat[2], mat[5], 0, mat[8]);
}
