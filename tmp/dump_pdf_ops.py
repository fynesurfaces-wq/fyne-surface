from pypdf import PdfReader
from pypdf.generic import ContentStream

reader = PdfReader('C:/Users/Ashu/Downloads/FYN/(n)20x20inches - 2026 -Premium Greenwall Collection- FYNE Surfaces.pdf.pdf')
def dump(stream_obj, resources, depth=0):
    stream = ContentStream(stream_obj, reader)
    for operands, operator in stream.operations:
        if operator in (b'q', b'Q', b'cm', b'Do'):
            print('  ' * depth, operator, operands)
        if operator == b'Do':
            name = operands[0]
            xobj = resources['/XObject'][name].get_object()
            if xobj.get('/Subtype') == '/Form':
                print('  ' * depth, 'FORM', name, xobj.get('/BBox'))
                dump(xobj, xobj['/Resources'].get_object(), depth + 1)

page = reader.pages[2]
dump(page.get_contents(), page['/Resources'].get_object())
