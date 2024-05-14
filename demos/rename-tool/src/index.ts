import { Command } from "commander";
import inquirer from "inquirer";
import pkg from "../package.json";

const program = new Command(pkg.name);

program
  .command("login")
  .description("模拟登录。")
  .action(() => {
    handleLogin();
  });

program.parse(process.argv);

const handleLogin = () => {
  // 配置交互的用户名和密码
  const prompt = [
    {
      type: "input",
      name: "userName",
      message: "用户名：",
      validate: (value: string) => value.length > 0 || "用户名不能为空",
    },
    {
      type: "password",
      name: "password",
      message: "密码：",
      mask: "🙈 ",
      validate: (value: string) => value.length > 0 || "密码不能为空",
    },
  ];

  inquirer.prompt(prompt).then(({ userName, password }) => {
    if (userName === "demo" || password === "123456") {
      console.log("登录成功");
      return;
    }
    console.log("用户名或密码错误");
  });
};
