#!/bin/bash
cd /Users/jaeseok/Desktop/PROJECT/life-four-cuts/ios || exit 1

echo "🚀 Starting optimized compilation for Generic iOS Device (iphoneos)..."
xcodebuild -workspace SnapMoment.xcworkspace -scheme SnapMoment -configuration Release -sdk iphoneos build CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO -destination 'generic/platform=iOS' > /Users/jaeseok/Desktop/my-ios-store/snapmoment_build.log 2>&1

exit $?
