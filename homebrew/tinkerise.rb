# Homebrew formula for tinkerise
# This file is a template for the tinkerise/homebrew-tap repository.
# It is automatically updated by the update-formula.yml workflow.
class Tinkerise < Formula
  desc "Scaffold any project with any stack"
  homepage "https://github.com/tinkerise/tinkerise"
  url "https://registry.npmjs.org/tinkerise/-/tinkerise-0.0.0.tgz"
  sha256 "PLACEHOLDER_SHA256"
  license "MIT"

  # Node.js must be pre-installed (not declared as dependency per project decision)

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink libexec.glob("bin/*")
  end

  def caveats
    <<~EOS
      tinkerise requires Node.js >= 20.11.0.
      Install Node.js: brew install node
    EOS
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/tinkerise --version")
    assert_match "tinkerise", shell_output("#{bin}/tinkerise --help")
  end
end
