export NODE_OPTIONS := --redirect-warnings=artifacts/node-warnings

CHANGELOG_TAG_URL_PREFIX := https://github.com/ezzatron/fake-permissions/releases/tag/

################################################################################

-include .makefiles/Makefile
-include .makefiles/pkg/js/v1/Makefile
-include .makefiles/pkg/js/v1/with-npm.mk
-include .makefiles/pkg/js/v1/with-arethetypeswrong.mk
-include .makefiles/pkg/js/v1/with-publint.mk
-include .makefiles/pkg/js/v1/with-skypack-package-check.mk
-include .makefiles/pkg/js/v1/with-tsc.mk
-include .makefiles/pkg/changelog/v1/Makefile

.makefiles/%:
	@curl -sfL https://makefiles.dev/v1 | bash /dev/stdin "$@"
