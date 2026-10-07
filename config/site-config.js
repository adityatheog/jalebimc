/* =========================================================
   JalebiMC — site configuration
   ---------------------------------------------------------
   Edit THIS file to change server addresses, ports, links,
   site name, title, description and copyright year.
   The whole website reads its values from here.

   This file is PUBLIC (GitHub Pages serves it to everyone).
   NEVER put passwords, API keys, tokens or other secrets here.
   ========================================================= */
window.JALEBI_CONFIG = {

  site: {
    name: "JalebiMC",
    shortMark: "J",                         // letter shown in the logo square
    domain: "jalebimc.in",                  // shown in the footer
    url: "https://jalebimc.in/",            // canonical + Open Graph URL (keep trailing slash)
    title: "JalebiMC — India's Lifesteal Minecraft Server (Java & Bedrock)",
    description: "JalebiMC is an Indian Lifesteal SMP Minecraft server with Java and Bedrock cross-play. Steal hearts, raid bases and join the community.",
    socialDescription: "Lifesteal SMP for players across India — Java and Bedrock cross-play.",
    eyebrow: "India's Lifesteal Minecraft Server",
    tagline: "Lifesteal SMP. Java & Bedrock. Built for India.",
    footerBlurb: "India's cross-play Lifesteal Minecraft server for Java and Bedrock players.",
    locale: "en_IN",
    themeColor: "#ff8a00",
    year: 2026                              // copyright year
  },

  server: {
    java: {
      edition: "Java Edition",
      host: "fun.jalebimc.in",
      port: 30109,
      supportedVersions: "1.7.2 – 26.x",
      copyWithPort: true                    // copy button copies host:port (false = host only)
    },

    bedrock: {
      edition: "Bedrock Edition",
      host: "bedrock.jalebimc.in",
      port: 30186,
      copyWithPort: true
    },

    // Live status checks the JAVA server only, via mcstatus.io. The Java
    // host:port above is appended to baseUrl automatically, e.g. .../v2/status/java/fun.jalebimc.in:30109
    statusApi: {
      baseUrl: "https://api.mcstatus.io/v2/status/java/",
      refreshInterval: 45000                // milliseconds (minimum 10000 is enforced)
    }
  },

  links: {
    discord: "https://dsc.gg/jalebimc",
    store: "https://store.jalebimc.in"
  }
};
