UUID = net-profile-switcher@etu
EXT_DIR = $(HOME)/.local/share/gnome-shell/extensions/$(UUID)
BIN_DIR = $(HOME)/.local/bin

.PHONY: all install pack clean

all: install

install:
	@./install.sh

pack:
	@gnome-extensions pack . --out-dir=build/ --force

clean:
	@rm -rf build/
