const vertexShaderSource = `
attribute vec3 vertex;        // Координаты вершины
attribute vec3 normal;        // Нормаль вершины
attribute vec2 texCoord;      // Текстурные координаты

uniform mat4 matrix;          // Матрица преобразования
uniform mat4 normalMatrix;    // Матрица для нормалей

varying vec3 vColor;          // Итоговый цвет
varying vec2 vTexCoord;       // Текстурные координаты

uniform vec3 lightDirection;  // Направление источника света
uniform vec3 viewPosition;    // Позиция камеры
uniform vec3 ambientColor;    // Цвет амбиентного освещения
uniform vec3 diffuseColor;    // Цвет диффузного освещения
uniform vec3 specularColor;   // Цвет зеркального освещения
uniform float shininess;      // Степень блеска

void main() {
    // Преобразование вершины
    vec4 position = matrix * vec4(vertex, 1.0);
    gl_Position = position;
    vTexCoord = texCoord;

    // Преобразование нормали
    vec3 N = normalize((normalMatrix * vec4(normal, 0.0)).xyz);

    // Вычисление освещения
    vec3 lightDir = normalize(lightDirection);
    vec3 viewDir = normalize(viewPosition - position.xyz);

    // Ambient
    vec3 ambient = ambientColor;

    // Diffuse
    float diff = max(dot(N, lightDir), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // Specular
    vec3 reflectDir = reflect(-lightDir, N);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    vec3 specular = spec * specularColor;

    // Итоговый цвет
    vColor = ambient + diffuse + specular;
}

`;

const fragmentShaderSource = `
precision mediump float;

varying vec3 vColor;      // Интерполированный цвет из вершинного шейдера
varying vec2 vTexCoord;   // Текстурные координаты

uniform sampler2D diffuseTexture;  // Текстура диффузного освещения

void main() {
    // Модификация итогового цвета с использованием текстуры
    vec3 textureColor = texture2D(diffuseTexture, vTexCoord).rgb;
    vec3 finalColor = vColor * textureColor; // Комбинируем цвет освещения и текстуры

    gl_FragColor = vec4(finalColor, 1.0);
}

`;
