import { declare } from "@babel/helper-plugin-utils";
import syntaxDoExpressions from "@babel/plugin-syntax-do-expressions";
// 一个简单的babel插件的实现逻辑
export default declare(api => {
  api.assertVersion(7);

  return {
    name: "proposal-do-expressions",
    inherits: syntaxDoExpressions,

    visitor: {
      DoExpression: {
        exit(path) {
          const body = path.node.body.body;
          if (body.length) {
            path.replaceExpressionWithStatements(body);
          } else {
            path.replaceWith(path.scope.buildUndefinedNode());
          }
        },
      },
    },
  };
});
