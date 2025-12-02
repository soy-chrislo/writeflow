interface PreviewProps {
	content: string
}

const Preview = ({ content }: PreviewProps) => {
	return (
		<div className="h-full overflow-auto">
			<div className="p-4 border-b border-gray-300 bg-gray-50">
				<h2 className="text-sm font-medium text-gray-600">Preview</h2>
			</div>
			<div
				className="content-body p-4"
				dangerouslySetInnerHTML={{ __html: content }}
			/>
		</div>
	)
}

export default Preview
