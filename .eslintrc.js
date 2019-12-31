module.exports = {
    // //extends用于引入某配置作为基础配置，然后再在后续的rules中对其进行扩展,共享rules
    //extends 中以plugin: 开头的字符串，如 "plugin:react/recommended"，这些写意味着应用第三方插件，eslint-plugin-react 的所有推荐规则
    //eslint-config-开头的可以省略eslint-config-
    //extents 中的每一项内容最终都指向了一个和 ESLint 本身配置规则相同的对象。
    "extends": ["airbnb", "prettier","prettier/react"],
    "parser": "babel-eslint",
    "plugins": [
        "prettier",
        "react",
        "jsx-a11y",
        "import"],
    //自定义规则，可以覆盖掉extends的配置。
    "rules": {
        "jsx-a11y/click-events-have-key-events":0,
        "jsx-a11y/interactive-supports-focus":0,
        "jsx-a11y/no-static-element-interactions ":0,
        // 'one-var':2,//声明变量是单行、多行，"error" 或 2 开启规则，使用错误级别的错误
        // 强制驼峰命名规则
        "camelcase": [0, {
            "properties": "never"
        }],
        "prettier/prettier": ["error"],
        "react/prop-types": ["warn"],
        "react/jsx-uses-react": "error",
        "react/jsx-uses-vars": "error",
        "no-unused-vars": 1,//"warn" 或 1 - 开启规则，使用警告级别的错误
        "global-require": 0,//"off" 或 0 - 关闭规则
        "prefer-destructuring": 0,
        "class-methods-use-this": 0,
        "react/no-unused-state": 1,
        "jsx-a11y/no-static-element-interactions":0,
        "import/extensions":0
    },
    "env":{
        //定义env会带进来一些全局变量，browser会添加所有的浏览器变量比如Windows
        "browser": true,
        "es6": true
},
    //当我们将默认的解析器从Espree改为babel-eslint的时候，我们需要指定parseOptions，这个是必须的。parserOptions ESLint 允许你指定你想要支持的 JavaScript 语言选项。默认情况下，ESLint 支持 ECMAScript 5 语法。你可以覆盖该设置，以启用对 ECMAScript 其它版本和 JSX 的支持。
    "parserOptions": {
        //sourceType，源码类型（指定被检查的文件是什么扩展名的）
        "sourceType": "module",//设置为 "script" (默认) 或 "module"（因为我们用了ES6，所以可设置为module)
        //ecmaFeatures - 这是个对象，表示你想使用的额外的语言特性:
        "ecmaFeatures": {
            "jsx": true// 启用 JSX
        },
        "ecmaVersion": 6
    },
    //settings 用来传输一些共享的配置，该字段定义的数据可以在所有的插件中共享。这样每条规则执行的时候都可以访问这里面定义的数据
    //如果我们想对一些非标准 JS 语法添加 Lint 怎么办呢？有办法，ESLint 还支持我们自定义 parser。 parser是为了非标准语法能生的，plugin是针对符合js语法的规则集合的扩展。
};