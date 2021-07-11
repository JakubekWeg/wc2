import { ColorsPalette } from './colors-palette'

const VERTEX_SHADER_SOURCE = `
attribute vec4 a_position;
attribute vec2 a_texcoord;

varying vec2 v_texcoord;

void main() {
    gl_Position = a_position;
    v_texcoord = a_texcoord;
}
`
const FRAGMENT_SHADER_SOURCE = `
precision mediump float;

varying vec2 v_texcoord;
uniform sampler2D u_texture;
uniform float u_sourceColors[4 * 3];
uniform float u_destinationColors[4 * 3];

void main() {
	vec4 color = texture2D(u_texture, v_texcoord);
	if (color.r == u_sourceColors[0] && color.g == u_sourceColors[1] && color.b == u_sourceColors[2])
		color = vec4(u_destinationColors[0], u_destinationColors[1], u_destinationColors[2], color.a);
		
	else if (color.r == u_sourceColors[3] && color.g == u_sourceColors[4] && color.b == u_sourceColors[5])
		color = vec4(u_destinationColors[3], u_destinationColors[4], u_destinationColors[5], color.a);
		
	else if (color.r == u_sourceColors[6] && color.g == u_sourceColors[7] && color.b == u_sourceColors[8])
		color = vec4(u_destinationColors[6], u_destinationColors[7], u_destinationColors[8], color.a);
		
	else if (color.r == u_sourceColors[9] && color.g == u_sourceColors[10] && color.b == u_sourceColors[11])
		color = vec4(u_destinationColors[9], u_destinationColors[10], u_destinationColors[11], color.a);
		
    gl_FragColor = color; 
}
`

const notNull = <T>(value: T | null, what: string): T => {
	if (value == null) throw new Error('Failed to obtain ' + what)
	return value
}

function createShader(gl: WebGLRenderingContext, type: 'vertex' | 'fragment', source: string): WebGLShader {
	const shader = notNull(gl.createShader(type === 'vertex' ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER), type + ' shader')
	gl.shaderSource(shader, source)
	gl.compileShader(shader)

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
		throw new Error('Could not compile WebGL ' + type + ' program. ' + gl.getShaderInfoLog(shader))

	return shader
}

let cachedCanvas: HTMLCanvasElement
const getCanvas = (): HTMLCanvasElement => {
	if (!cachedCanvas) {
		cachedCanvas = document.createElement('canvas')
	}
	return cachedCanvas
}

let cachedContext: WebGLRenderingContext
const getContext = (): WebGLRenderingContext => {
	if (!cachedContext) {
		cachedContext = notNull(getCanvas()
			.getContext('webgl', {
				alpha: true,
				depth: false,
				premultipliedAlpha: false,
				antialias: false,
				powerPreference: 'low-power',
				preserveDrawingBuffer: false,
				stencil: false,
			}), 'WebGL context')
	}
	return cachedContext
}

let cachedProgramData: { destinationColors: WebGLUniformLocation; sourceColors: WebGLUniformLocation; texture: WebGLUniformLocation; texCoord: number; position: number; program: WebGLProgram }
const getProgram = () => {
	if (!cachedProgramData) {
		const gl = getContext()
		const program = notNull(gl.createProgram(), 'WebGL program')

		gl.attachShader(program, createShader(gl, 'vertex', VERTEX_SHADER_SOURCE))
		gl.attachShader(program, createShader(gl, 'fragment', FRAGMENT_SHADER_SOURCE))

		gl.linkProgram(program)
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			const info = gl.getProgramInfoLog(program)
			throw new Error('Could not compile WebGL program. \n' + info)
		}

		cachedProgramData = {
			position: gl.getAttribLocation(program, 'a_position'),
			texCoord: gl.getAttribLocation(program, 'a_texcoord'),
			texture: notNull(gl.getUniformLocation(program, 'u_texture'), 'texture location'),
			sourceColors: notNull(gl.getUniformLocation(program, 'u_sourceColors'), 'source colors location'),
			destinationColors: notNull(gl.getUniformLocation(program, 'u_destinationColors'), 'final colors location'),
			program,
		}
	}
	return cachedProgramData
}

let cachedBuffers: { position: WebGLBuffer, texture: WebGLBuffer }
const getPositionsBuffers = () => {
	if (!cachedBuffers) {
		const gl = getContext()
		const positionBuffer = notNull(gl.createBuffer(), 'buffer for position')
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			-1, -1,
			-1, 1,
			1, -1,
			1, -1,
			-1, 1,
			1, 1,
		]), gl.STATIC_DRAW)

		const texturePositionBuffer = notNull(gl.createBuffer(), 'buffer for texture coords')
		gl.bindBuffer(gl.ARRAY_BUFFER, texturePositionBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
			0, 1,
			0, 0,
			1, 1,
			1, 1,
			0, 0,
			1, 0,
		]), gl.STATIC_DRAW)

		cachedBuffers = {
			position: positionBuffer,
			texture: texturePositionBuffer,
		}
	}
	return cachedBuffers
}

let cachedTexture: WebGLTexture
const getTexture = () => {
	if (!cachedTexture) {
		const gl = getContext()
		const tex = notNull(gl.createTexture(), 'texture')
		gl.bindTexture(gl.TEXTURE_2D, tex)

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)

		gl.bindTexture(gl.TEXTURE_2D, tex)
		cachedTexture = tex
	}
	return cachedTexture
}

const bindBuffersBeforeDraw = () => {
	const gl = getContext()
	const buffers = getPositionsBuffers()
	const program = getProgram()

	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position)
	gl.enableVertexAttribArray(program.position)
	gl.vertexAttribPointer(program.position, 2, gl.FLOAT, false, 0, 0)

	gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texture)
	gl.enableVertexAttribArray(program.texCoord)
	gl.vertexAttribPointer(program.texCoord, 2, gl.FLOAT, false, 0, 0)

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
	gl.useProgram(program.program)
}

const bindTextureToImage = (img: HTMLImageElement | HTMLCanvasElement) => {
	const gl = getContext()
	const tex = getTexture()

	gl.bindTexture(gl.TEXTURE_2D, tex)
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
}

const prepareColorUniform = (location: WebGLUniformLocation, value: ColorsPalette) => {
	const gl = getContext()
	gl.uniform1fv(location, value)
}

const setUniformsBeforePaint = (from: ColorsPalette, to: ColorsPalette) => {
	const gl = getContext()
	const program = getProgram()

	prepareColorUniform(program.sourceColors, from)
	prepareColorUniform(program.destinationColors, to)

	gl.uniform1i(program.texture, 0)

}
const executePaint = () => {
	const gl = getContext()
	gl.drawArrays(gl.TRIANGLES, 0, 6)
}

const prepareCanvasForImage = (source: HTMLImageElement | HTMLCanvasElement): HTMLCanvasElement => {
	const canvas = getCanvas()
	canvas.width = source.width
	canvas.height = source.height
	return canvas
}

export const paintTextureAndGetDataUrl = (source: HTMLImageElement | HTMLCanvasElement,
                                          from: ColorsPalette, to: ColorsPalette): string => {
	const canvas = prepareCanvasForImage(source)

	bindTextureToImage(source)
	bindBuffersBeforeDraw()
	setUniformsBeforePaint(from, to)
	executePaint()

	return canvas.toDataURL('image/png')
}

export default paintTextureAndGetDataUrl
