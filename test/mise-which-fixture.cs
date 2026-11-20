using System;
using System.IO;
using System.Reflection;

// Controlled executables for the Windows physical tool discovery regression.
public static class MiseWhichFixture {
    public static int Main(string[] args) {
        string name = Path.GetFileNameWithoutExtension(Assembly.GetExecutingAssembly().Location);
        if (name == "mise") {
            if (args.Length != 5 || args[0] != "--no-config" || args[1] != "which" ||
                args[3] != "--tool" || (args[2] != "bun" && args[2] != "aube") ||
                args[4] != args[2] + "@" + (args[2] == "bun" ? "1.4.2" : "2.5.1") ||
                Environment.GetEnvironmentVariable("MISE_AUTO_INSTALL") != "false" ||
                Environment.GetEnvironmentVariable("MISE_OFFLINE") != "true")
                return 22;
            string result = Environment.GetEnvironmentVariable("FIXTURE_MISE_RESULT");
            Console.WriteLine(result ?? Path.Combine(Environment.GetEnvironmentVariable("FIXTURE_TOOLS"), args[2] + ".exe"));
            return 0;
        }
        if (args.Length == 1 && args[0] == "--version") {
            if (name == "aube" && (Environment.GetEnvironmentVariable("AUBE_MANAGE_PACKAGE_MANAGER_VERSIONS") != "false" ||
                Environment.GetEnvironmentVariable("AUBE_NO_UPDATE_CHECK") != "1" ||
                Environment.GetEnvironmentVariable("npm_config_manage_package_manager_versions") != null)) return 24;
            Console.WriteLine(name == "bun" ? "1.4.2" : "2.5.1 windows-x64 (2026-09-27)");
            return 0;
        }
        if (args.Length == 1 && args[0] == "literal argument") {
            if (name == "aube" && Environment.GetEnvironmentVariable("npm_config_manage_package_manager_versions") != "true")
                return 25;
            Console.WriteLine(name + " physical");
            return 0;
        }
        return 23;
    }
}
